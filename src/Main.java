// 간단 예시: 실제 정적 웹(index.html 등)은 /web 폴더를
// VSCode Live Server, Python http.server, Nginx 등으로 서빙하면 됩니다.
// Java 쪽은 백엔드 API가 필요할 때만 사용하세요.

public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from Java backend (optional).");
        // 여기에 백엔드 로직(예: REST API) 추가 가능
        // 정적 파일은 web/ 폴더에서 별도 정적 서버로 서비스하는 것을 권장합니다.
    }
}
