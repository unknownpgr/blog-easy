using System;
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

namespace EasyBlog
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
            System.Diagnostics.Process.Start(url + "/manager");

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

            // API call
            if (urlPath == "/api" || urlPath.StartsWith("/api/"))
            {
                try
                {
                    string apiName = urlPath.Replace("/api/", "").Replace("/api", "").ToLower();
                    Dictionary<string, string> query = req.QueryString.AllKeys.ToDictionary(t => t, t => req.QueryString[t]);

                    string localPath = query.ContainsKey("path") ? ConvertPath(query["path"]) : "";
                    Console.WriteLine("API : " + apiName + "\t" + "PATH : " + localPath);
                    switch (apiName)
                    {
                        // List given directory
                        case "dir":
                            res.SendData(Directory.GetFiles(localPath).Concat(Directory.GetDirectories(localPath)));
                            break;

                        // Real file from local
                        case "read":
                            res.SendData(File.ReadAllLines(localPath));
                            break;

                        // Write file to local
                        case "write":
                            File.WriteAllText(localPath, query["content"]);
                            res.SendData();
                            break;

                        // Delete local file
                        case "delete":
                            File.Delete(localPath);
                            res.SendData();
                            break;

                        // Read url
                        case "url":
                            using (WebClient wc = new WebClient())
                            using (StreamReader s = new StreamReader(wc.OpenRead(query["path"])))
                            {
                                res.SendData(s.ReadToEnd());
                            }
                            break;

                        default:
                            res.SendData(state: "error", message: "unregistered api call");
                            break;
                    }
                }
                catch (Exception e)
                {
                    res.SendData(state: "error", message: e.Message);
                }
            }
            // Manager default path
            else if (urlPath == "/manager" || urlPath == "/manager/") res.SendFile(ConvertPath("/manager/index.html"));
            // Default path
            else if (urlPath == "" || urlPath == "/") res.Redirect("/manager");
            // Send file
            else res.SendFile(ConvertPath(urlPath));
        }

        private static string ConvertPath(string path)
        {
            if (path.ElementAt(1) != ':') path = "./" + path;

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

            // Return path
            return path;
        }

        private static async void SendString(HttpListenerResponse res, string str)
        {
            res.ContentType = "text/html";
            byte[] buf = Encoding.UTF8.GetBytes(str);
            await res.OutputStream.WriteAsync(buf, 0, buf.Length);
            res.Close();
        }
    }

    static class HttpResponseExtend
    {
        public static async void SendData(this HttpListenerResponse res, object content = null, string state = "ok", string message = "")
        {
            res.ContentType = "text/json";

            Dictionary<string, object> ret = new Dictionary<string, object>();
            ret["state"] = state;
            ret["message"] = message;
            ret["content"] = content;

            byte[] buf = Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(ret).ToString());
            await res.OutputStream.WriteAsync(buf, 0, buf.Length);
            res.Close();
        }

        public static async void SendFile(this HttpListenerResponse res, string path)
        {
            Console.WriteLine("Required file:" + path);
            if (!File.Exists(path))
            {
                res.StatusCode = 404;
                res.Close();
            }
            else
            {
                long length = new FileInfo(path).Length;
                res.ContentType = "text/html";
                res.ContentEncoding = Encoding.UTF8;
                res.ContentLength64 = length;
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
