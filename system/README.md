# EasyBlog - 쉬운 깃허브 블로그.
## 개발 동기
 사용자가 마음대로 커스터마이즈할 수 있다는 점에서, 깃허브는 블로그를 위한 좋은 플랫폼이라고 생각됩니다. 깃허브 블로그의 장점은 아래와 같습니다.
- 다른 블로그와 다르게, 깃허브 블로그는 정적 호스팅을 기반으로 하기 때문에 만약 깃허브가 망해서 사라지더라도 정적 파일 호스팅만 할 수 있는 환경이라면 블로그를 쉽게 재구축할 수 있습니다. 예를 들어 블로그를 그대로 라즈베리파이에 옮기는 것도 쉽게 가능합니다.

- 깃허브는 말 그대로 저장소이기 때문에, 블로그의 백업이 매우 간편하고, 변경 추적도 쉽습니다.
- 사용자가 그 어떤 플랫폼보다 자유롭게 커스터마이즈할 수 있습니다. 블로그 글만이 아니라 시스템 자체를 호스팅하는 것이기 때문에, 블로그 시스템 자체를 쉽게 수정할 수 있습니다.

다만 문제는, 기존의 깃허브 블로그 시스템은 너무 어렵습니다. 프로그래머들이야 밥먹듯이 깃허브를 이용하니까 그 작동 방식을 쉽게 이해할 수 있지만, 비전공자들에게 jekyll은 너무 사용하기 어려운 시스템일 수도 있습니다.
## 개발 목표
- 비전공자도 쉽게 사용할 수 있는 블로그 플랫폼을 만든다. 네이버 블로그처럼, 콘솔창을 띄우거나 하는 복잡한 조작 없이 그냥 클릭하면 알아서 글이 써지고 업로드되어야 한다.

- 그러므로 100% GUI로 구현합니다.
- Window, Ubuntu 등 다양한 운영체제에서 작동할 수 있어야 합니다.
- 그러므로 운영체제에 dependent한 부분은 최소화합니다.
- 깃허브를 제외하고는 별도의 프로그램 설치를 요구하지 않습니다. 예컨대 NodeJS를 사용하면 개발이 간편해지지만, 그렇게 하지 않고 .NetFramework를 사용합니다.
- 커스터마이즈 가능한 블로그 플랫폼을 사용하는 주 이유는 스킨 적용입니다. 따라서 스킨 적용이 매우 간편해야 합니다.
- 매우 기본적인 기능부터 단계적으로 구현해서, 사용자는 자신의 수준에 따라 원하는 만큼 커스터마이즈할 수 있어야만 합니다.
- 캡슐화가 잘 되어있어서 부분을 수정하더라도 프로그램 자체는 잘 작동해야합니다.
- 개발자가 업데이트하면 사용자가 쉽게 업데이트를 받아볼 수 있어야 하며, 그러나 사용자는 업데이트를 진행할지 선택할 수 있어야 합니다.
## 개발 상세
EasyBlog는 호환성, 디자인 등을 위하여 기본적으로 웹브라우저로 구현됩니다. 그러나 EasyBlog에 필요한 일부 기능, 예컨대 파일 생성, 삭제, URL 읽어오기 등의 기능은 웹브라우저에서 지원하지 않습니다. 그러므로 이런 기능들을 구현하는 서버가 하나 필요합니다. 따라서 EasyBlog는 크게 Server Layer와 Browser Layer로 나뉩니다.
### Server Layer
RESTful API를 사용하여 매우 기본적인 OS 기능을 제공하는 서버입니다. 단일한 C# exe파일이며, 다음과 같은 기능을 제공합니다.
- 루트 디렉토리 안에서의 정적 파일 서비스
- 루트 디렉토리 안에서의 파일/쓰기/삭제/생성(via RESTful API) (XHR을 통하여 읽기를 수행할 수 있기 때문에, 서버에서는 읽기를 구현할 필요가 없습니다.)
- 웹으로부터 URL읽어오기
- 실행될 때 크롬으로 블로그 관리자 실행
### Browser Layer
Server Layer에서 제공하는 기능을 바탕으로, 필요한 모든 기능을 구현합니다. 필요한 기능이란 아래와 같습니다.
- 블로그 포스팅의 작성/삭제/수정 등
- 블로그 관리. 예컨대 스킨, 블로그 구조 등.
## Blog structure
블로그는 다양한 구조를 가질 수 있습니다. 예컨대 흰 화면에 글만 순서대로 있을 수도 있고, 메인 화면에서 리스트를 보여준 후 리스트를 누르면 글이 보이도록 할 수도 있습니다. skin이란, 단순한 외양뿐만이 아니라 블로그 전체의 구조를 말하는 것입니다.
이런 구조는 두 가지 방법을 통해 구현될 수 있는데, 하나는 HTML-CSS기반이며 하나는 Javascript 기반입니다. HTML-CSS를 사용하는 유저를 위하여, 게시물의 제목이나 리스트 등을 Tag로써 가져올 수 있게 하는 반면, Javascript를 사용하는 유저를 위하여 동일한 정보를 JSON으로도 제공합니다.

### Skin
사용자가 작성하고 수정하기 편리한 skin을 구현하기 위하여, 다음과 같은 기능을 제공합니다.
- skin은 그 자체만으로도 아무 이상없이 정상적으로 작동해야만 합니다.
- Tag의 ID를 통한 InnerHTML을 대입만을 사용하며, Replace 함수를 이용한 치환은 사용하지 않습니다.
- 가능하면 div, span만을 사용하여 구현합니다.
- skin상에서 작동하는 a(href) tag, javascript등은 모두 본 서버에서도 동일하게 작동해야합니다.
- skin폴더는 file structure를 가질 수 있으며, 이는 본 서버에서도 동일하게 작동해야 합니다.

이런 조건들을 모두 만족하기 위해서, 블로그 매니저는 다음과 같이 작동합니다.
1. skins 폴더에는 여러 스킨들이 들어 있습니다.
1. 사용자가 어느 스킨을 선택합니다. 미리보기도 가능합니다.
1. 스킨 폴더가 올바른 구조를 가지고 있는지 검사합니다. 예컨대 스킨 폴더의 바로 아래에는 index.html파일이 있어야만 합니다.
1. 이후 사용자에 의해 미리 준비된 preserve.txt파일을 읽어서, 그 안에 있는 파일들과 폴더들을 제외하고는 모두 삭제합니다. preserve.txt파일에는 블로그가 작동하기 위해 삭제하면 안 되는 파일과 폴더들이 들어있습니다.
1. skin 폴더를 그대로 루트 디렉토리로 복사해옵니다. 만약 충돌이 발생하는 파일이 있다면, 건너뛰고 경고를 띄웁니다.
1. 이제 새로운 스킨을 바탕으로 블로그가 작동합니다.

### Posts
블로그의 메인인 포스트는 여러 시스템을 바탕으로 작동할 수 있습니다. 예컨대 HTML기반으로 작동할 수도 있고, 아니면 Markdown기반으로 작동할 수도 있습니다. Pure text만을 사용할 수도 있습니다. 어느 기반으로 작동할지는 스킨에 따라 크게  달라집니다. 이러한 포스트들을 잘 관리하기 위해, 다음과 같은 작업이 필요합니다.
- 포스트는 (id, title, tag, time, content)의 속성을 가집니다.
- id는 포스트를 유일무이하게 구분할 수 있는 unique key로 작동합니다. 또 포스트 파일의 이름이 되기도 합니다. 이론상 아무 값이나 가능하지만, 시간에 관계된 값이면 좋습니다.
- title은 포스트의 타이틀입니다.
- tag는 포스트 디렉토리 등으로 사용될 수 있는, 포스트의 메타정보입니다.
- time은 포스트 정렬에 사용될 포스트가 작성된 시간 데이터입니다. string이거나 long일 수 있습니다.
- content는 상기한 HTML, Markdown등으로 작성된 포스트의 내용입니다.

포스트에는 순수 텍스트뿐만이 아니라, 이미지를 포함한 대용량 데이터가 포함될 수도 있습니다. base64등의 인코딩으로 본문에 포함시키는 것 또한 방법이지만, 로딩 속도를 극적으로 늦출 수 있기 때문에 좋은 방법은 아닙니다. 그러므로 이미지를 본문이 아닌 다른 부분에 포함할 필요가 있습니다.

이를 해결하기 위해 두 가지 방법을 쓸 수 있습니다. 하나는 포스트 자체를 디렉토리 방식으로 만드는 것입니다. 이 방법의 특징은 아래와 같습니다.
- 각 포스트가 독립적으로 관리될 수 있습니다.
- URL이 깔끔합니다.
- 이 방법의 장점을 살리려면 각 포스트마다 viewer를 만들어주거나, viewer를 import하는 코드를 작성해주어야 합니다.
- 그러므로 viewer파일에서 미리보기를 구현하거나 하기가 조금 힘듭니다.
- 리소스 이름을 보존할 수 있습니다.
- 하이어라키 구조를 사용할 수 있습니다.
- 포스트 파일을 작성할 때 미리보기를 쉽게 할 수 있습니다.

나머지 방법은 포스트는 단일한 json파일로 통일하고, 이미지 등 외부 리소스를 한 데 모으는 방법입니다. 이 방법의 특징은 아래와 같습니다.
- 리소스를 고정된 디렉토리에 모으기 때문에, 참조가 간단합니다.
- viewer에서 import하는 방식이기 때문에 post파일의 구조가 간단해집니다.
- 중복된 리소스를 찾기 쉽습니다.
- 리소스 이름을 변경해야만 합니다.
- 포스트 파일을 작성할 때 이 블로그 전용으로 만들어진 에디터를 사용해야만 합니다.

이 두 방법의 장점을 모아보면, 다음과 같은 요구조건을 얻습니다.
- 포스트 작성은 매우 단순해야만 합니다. 다른 조작 필요 없이 html파일이나 markdown파일 단독으로 작성할 수 있어야 합니다. 그러므로 파일에 어떤 태그를 넣는다거나 하는 동작을 수행할 수 없을 수도 있습니다.
- 포스트 작성 시에 정적으로 서비스되는 그 방식 그대로 동적으로 서비스되어야 합니다.

그러므로 다음과 같은 방법으로 포스트 구조를 만듭니다.
1. 포스트 본문은 content.xyz형식으로 작성합니다. 그 외에 각종 파일, 폴더 심지어 각종 디렉토리까지 추가가 가능합니다.
1. 포스트를 볼 때에는 포스트 폴더/view.html파일로 엑세스합니다.
1. view.html파일은 자기 자신의 내용을 skin에 있는 viewer파일로 바꿉니다.
1. 로드된 새로운 viewer 파일은 content.xyz에 엑세스합니다.

### Renderer
렌더러는 정적 블로그 랜더링을 구현하는 단일 javascript 파일입니다. 모든 html에 동일하게 적용되며, 하는 역할은 단 하나로, 이 스크립트가 로드된 html파일에서 아이디/클래스를 통해 엘리먼트를 검색한 후, 대체가능한 엘리먼트가 있으면 필요한 내용으로 대체합니다.
#### Anywhere
- .blog_title : 블로그의 타이틀
- .blog_postListTime [data-n=5] : 최근 n개의 포스트. href가 설정된 a 태그가 삽입됨.
- .blog_postListTag data-tag [data-n=5] : tag에 해당하는 최근 n개의 포스트. href가 설정된 a 태그가 삽입됨.
#### On Post
- .blog_postTitle : 현재 포스트의 제목
- .blog_postBody : 현재 포스트의 내용
- .blog_postTime : 현재 포스트 작성 시간
- .blog_postID : 현재 포스트의 ID
- .blog_postTags : 현재 포스트의 태그들
- .blog_previousPost : 이전 포스트. href가 설정된 a가 삽입됨.
- .blog_nextPost : 다음 포스트. 마찬가지.

### Post writting
기존의 방법들과는 다르게, 새로운 서비스에서는 포스트 작성이 쉽지 않을 수 있습니다. 포스트를 쉽게 작성할 수 있는 툴을 제공하면서도, 사용자가 사용자 자신의 툴로도 쉽게 포스트를 수정할 수 있어야만 합니다.
- 포스트를 생성하는 것이 쉬워야합니다.
- 포스트의 메타 정보를 사용자가 쉽게 수정할 수 있지만, 그럴 필요가 없어야 합니다.
- 사용자는 포스트를 원하는 툴로 작성, 수정할 수 있어야 합니다.

그래서 다음과 같은 방법으로 포스트를 관리합니다.
- 포스트의 생성은 폴더를 생성하는 것으로부터도 가능하고, 

### Manager
매니저는 블로그 전체를 관리하는 서비스입니다.
블로그 포스트의 작성, 삭제, 수정, 스킨 선택 등 다양한 작업을 수행합니다.

# 개발 현황
#### 03/25 ~ 04 / 05
- 기본적인 틀 결정
- 로컬에서 작동할 서버 개발 완료
- 서버와 통신하는 자바스크립트파일 os.js개발 완료 (JQuery 사용, Ajax기반)
#### 04 / 06
- 모듈 작성을 위한 CommonJS, AMD, ES6 방법 등 공부
- 추후 적용을 위하여 Webpack, Babel등 Bundler 공부
- 자바스크립트 파일들 ES6로 리팩토링
- Renderer 테스트를 위한 포스트 작성 구현 중