import { HttpClient } from "../../framework/http/HttpClient";

// api接口封装
export class Api {

    public static init() {
        HttpClient.init('https://example.com');
        // 添加请求拦截器
        HttpClient.addRequestInterceptor((request) => {
             // 从本地存储获取token
             const token = localStorage.getItem('token');
             if (token) {
                request.headers = {
                     ...request.headers,
                     'Authorization': `${token}`
                 };
             }
             return request;
        });
        HttpClient.addResponseInterceptor((response) => {
            // 服务端返回格式为 { code: number, data: any, msg: string }
            const responseData = response.data as any;
                
            // 检查业务状态码
            if (responseData.code !== 0 && responseData.code !== -600) {
                const error = new Error(responseData.msg || '请求失败');
                (error as any).code = responseData.code;
                throw error;
            }
            
            // 提取实际数据
            response.data = responseData.data;
            return response;
        });
    } 
    
    /**
     * 用户登录
    */
    public static async login(param: { username: string, password: string}) {
        return HttpClient.post<{ token: string }>('api/login', param);
    }
}

