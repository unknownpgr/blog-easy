﻿using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Reflection;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Web;
using Newtonsoft.Json;

namespace BlogServer
{
    class HttpServer
    {
        public static HttpListener listener;
        public static string url = "http://localhost:8000/";
        public static string root = "";

        public static void Main(string[] args)
        {
            // Set root directory
            root = Directory.GetCurrentDirectory();

            // Create a Http server and start listening for incoming connections
            listener = new HttpListener();
            listener.Prefixes.Add(url);
            listener.Start();
            Console.WriteLine("Listening for connections on {0}", url);

            // Start manager
            //System.Diagnostics.Process.Start(url + "manager/");

            // Handle requests
            Task listenTask = HandleIncomingConnections();
            listenTask.GetAwaiter().GetResult();

            // Close the listener
            listener.Close();
        }

        public static async Task HandleIncomingConnections()
        {
            bool runServer = true;

            while (runServer)
            {
                // Will wait here until we hear from a connection
                HttpListenerContext ctx = await listener.GetContextAsync();
                ctx.Response.ContentType = "text/plain; charset=utf-8";

                // Peel out the requests and response objects
                HttpListenerRequest req = ctx.Request;
                HttpListenerResponse res = ctx.Response;

                // Print out some info about the request
                Console.WriteLine(req.HttpMethod + ":" + req.Url.AbsolutePath.ToString());

                HandleRequest(req, res);
                Console.WriteLine();
            }
        }

        // Handle callbacks.
        private static void HandleRequest(HttpListenerRequest req, HttpListenerResponse res)
        {
            string urlPath = req.Url.AbsolutePath;
            string httpMethod = req.HttpMethod;

            // API call
            if (urlPath == "/api" || urlPath.StartsWith("/api/"))
            {
                try
                {
                    string apiName = urlPath.Replace("/api/", "").Replace("/api", "").ToLower();
                    Dictionary<string, string> query = ParseQuery(req);
                    string localPath = query.ContainsKey("path") ? ConvertPath(query["path"]) : "NULL";

                    // Debug
                    if (true)
                    {
                        Console.WriteLine("API : " + apiName + "\t" + "PATH : " + localPath);
                        foreach (string key in query.Keys) Console.WriteLine(key + "\t: " + query[key]);
                    }

                    // Handle API
                    HandleAPI(res, apiName, localPath, query);
                }
                catch (Exception e)
                {
                    Console.WriteLine(e.Message + ":" + e.StackTrace);
                    res.Response(status: "error", message: e.Message + ":" + e.StackTrace);
                }
            }

            // This functions serves files. therefore it must 
            else if (httpMethod != "HEAD")
            {
                // Manager default path
                if (urlPath == "/manager/") res.SendFile(ConvertPath("/manager/index.html"), httpMethod);
                // Default path
                else if (urlPath == "" || urlPath == "/") res.Redirect("/manager/");

            }

            // Send file
            else res.SendFile(ConvertPath(urlPath), httpMethod);
        }

        private static void HandleAPI(HttpListenerResponse res,string apiName, string localPath, Dictionary<string,string> query)
        {
            switch (apiName)
            {
                // List given directory
                case "dir":
                    List<Dictionary<string, string>> items = new List<Dictionary<string, string>>();
                    DirectoryInfo di = new DirectoryInfo(localPath);
                    foreach (FileInfo info in di.GetFiles()) items.Add(new Dictionary<string, string>()
                    {
                        ["name"] = info.Name,
                        ["type"] = "file"
                    });
                    foreach (DirectoryInfo info in di.GetDirectories()) items.Add(new Dictionary<string, string>()
                    {
                        ["name"] = info.Name,
                        ["type"] = "directory"
                    });
                    res.Response(items);
                    break;

                // Write file to local
                case "write":
                    File.WriteAllText(localPath, query["content"], Encoding.UTF8);
                    res.Response();
                    break;

                // Read url
                case "url":
                    using (WebClient wc = new WebClient())
                    using (StreamReader s = new StreamReader(wc.OpenRead(query["path"])))
                    {
                        string str = s.ReadToEnd();
                        res.Response(str);
                    }
                    break;

                // Delete local file
                case "remove":
                    //SetAttrNoraml(new DirectoryInfo(localPath));
                    File.Delete(localPath);
                    res.Response();
                    break;

                // Create directory
                case "mkdir":
                    Directory.CreateDirectory(localPath);
                    res.Response();
                    break;

                // Delete directory
                case "rmdir":
                    Directory.Delete(localPath);
                    res.Response();
                    break;

                case "exists":
                    bool isFile = File.Exists(localPath);
                    bool isDir = Directory.Exists(localPath);
                    res.Response(new Dictionary<string, bool>
                    {
                        ["isFile"] = isFile,
                        ["isDirectory"] = isDir,
                        ["exists"] = isFile || isDir
                    });
                    break;

                // Unregistered api
                default:
                    res.Response(status: "error", message: "unregistered api call");
                    break;
            }
        }

        private static void SetAttrNoraml(DirectoryInfo dir)
        {
            foreach (DirectoryInfo subDir in dir.GetDirectories()) SetAttrNoraml(subDir);
            foreach (var file in dir.GetFiles()) file.Attributes = FileAttributes.Normal;
            dir.Attributes = FileAttributes.Normal;
        }

        private static string ConvertPath(string path)
        {
            try
            {
                if (path == "/") return root;

                // Not absolute path and not well-rooted path.
                if (!path.StartsWith("./") && path[1] != ':')
                {
                    // When path starts with root
                    if (path[0] == '/') path = "." + path;
                    // When path starts with file name
                    else path = "./" + path;
                }
                Console.WriteLine("Access to path : " + path);

                // Get full directory
                path = Path.GetFullPath(path);

                // Check if given directory is inside root directory
                DirectoryInfo rootDir = new DirectoryInfo(root);
                DirectoryInfo sub = new DirectoryInfo(path);
                bool isInsideRoot = false;
                while (sub.Parent != null)
                {
                    if (sub.Parent.FullName == rootDir.FullName)
                    {
                        isInsideRoot = true;
                        break;
                    }
                    else sub = sub.Parent;
                }
                if (!isInsideRoot) throw new Exception("Given path " + path + " is not in root directory.");
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                return "";
            }

            // Return path
            return path;
        }

        private static Dictionary<string, string> ParseQuery(HttpListenerRequest req)
        {
            // Parse GET data
            Dictionary<string, string> query = req.QueryString.AllKeys.ToDictionary(t => t, key =>
            {
                string value = req.QueryString[key];
                return value;
            });

            // Parset Post data
            StreamReader getPostParam = new StreamReader(req.InputStream, true);
            string data = getPostParam.ReadToEnd();
            foreach (string queryPair in data.Split('&'))
            {
                string[] split = queryPair.Split('=');
                if (split.Length < 2)
                {
                    Console.WriteLine(queryPair);
                    continue;
                }
                string key = WebUtility.UrlDecode(split[0]);
                string value = WebUtility.UrlDecode(split[1]);
                query[key] = value;
            }
            return query;
        }
    }

    static class HttpResponseExtend
    {
        public static async void Response(this HttpListenerResponse res, object content = null, string status = "ok", string message = "")
        {
            res.ContentType = "text/json";

            Dictionary<string, object> ret = new Dictionary<string, object>();
            ret["status"] = status;
            ret["message"] = message;
            ret["content"] = content;

            byte[] buf = Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(ret).ToString());
            await res.OutputStream.WriteAsync(buf, 0, buf.Length);
            res.Close();
        }

        public static async void SendFile(this HttpListenerResponse res, string path, string httpMethod)
        {
            Console.WriteLine("Required file:" + path);
            if (!File.Exists(path))
            {
                res.StatusCode = 404;
                res.Close();
            }
            else if (httpMethod == "HEAD")
            {
                res.StatusCode = 200;
                res.Close();
            }
            else
            {
                FileInfo fi = new FileInfo(path);
                long length = fi.Length;

                switch (fi.Extension.Replace(".", ""))
                {
                    case "html":
                        res.ContentType = "text/html";
                        break;

                    case "txt":
                        res.ContentType = "text/plain";
                        break;

                    case "js":
                        res.ContentType = "text/javascript";
                        break;

                    case "json":
                        res.ContentType = "application/json";
                        break;

                    case "jpg":
                        res.ContentType = "image/jpg";
                        break;

                    case "jpeg":
                        res.ContentType = "image/jpeg";
                        break;

                    case "png":
                        res.ContentType = "image/png";
                        break;

                    default:
                        res.ContentType = "application/*";
                        break;
                }
                res.ContentEncoding = Encoding.UTF8;
                res.ContentLength64 = length;
                {
                    using (FileStream fs = new FileStream(path, FileMode.Open))
                    using (Stream sw = res.OutputStream)
                    {
                        byte[] buf = new byte[1024];
                        int offset = 0;
                        int len;
                        while ((len = fs.ReadAsync(buf, 0, 1024).GetAwaiter().GetResult()) > 0)
                        {
                            offset += len;
                            await sw.WriteAsync(buf, 0, len);
                        }
                    }
                    res.Close();
                }
            }
        }
    }
}
