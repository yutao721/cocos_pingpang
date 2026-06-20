import { HttpCore } from './HttpCore';
import { HttpMethod, HttpRequestOptions, HttpResponse } from './HttpRequester';

/**
 * API端点配置接口
 */
export interface HttpEndpointConfig {
    baseUrl: string;
    headers?: Record<string, string>;
    timeout?: number;
}

/**
 * HTTP工具类 - 提供简单的静态方法进行HTTP请求
 * 支持多端点管理
 */
export class HttpClient {
    private static endpoints: Map<string, HttpCore> = new Map();
    private static defaultEndpoint: string = 'default';

    /**
     * 初始化HTTP工具类，创建默认端点
     * @param baseUrl 
     */
    public static init(baseUrl: string): void {
        if (this.endpoints.has(this.defaultEndpoint)) {
            return;
        }
        // 创建一个新的HttpManager实例作为主管理器
        const manager = new HttpCore();
        manager.setBaseUrl(baseUrl);
        // 注册为默认端点
        this.register({ baseUrl }, this.defaultEndpoint);
    }

    /**
     * 获取HTTP管理器实例
     * @param endpointName 端点名称，如果不提供则使用默认端点
     */
    public static getManager(name?: string): HttpCore {
        const endpointName = name || this.defaultEndpoint;
        const manager = this.endpoints.get(endpointName);
        if (!manager) {
            throw new Error(`HTTP端点 '${endpointName}' 不存在`);
        }
        return manager;
    }
    
    /**
     * 注册API端点
     * @param name 端点名称
     * @param config 端点配置
     */
    public static register(config: HttpEndpointConfig, endpointName?: string): void {

        const name = endpointName || this.defaultEndpoint;

        // 检查是否已经存在同名端点
        if (this.endpoints.has(name)) {
            throw new Error(`HTTP端点 '${name}' 已经存在`);
        }

        // 每个端点创建独立的Manager实例
        const manager = new HttpCore();
        manager.setBaseUrl(config.baseUrl);

        // 设置默认请求头
        if (config.headers) {
            manager.addRequestInterceptor((options) => {
                options.headers = { ...options.headers, ...config.headers };
                return options;
            });
        }

        // 设置默认超时
        if (config.timeout) {
            manager.addRequestInterceptor((options) => {
                if (!options.timeout) {
                    options.timeout = config.timeout;
                }
                return options;
            });
        }

        this.endpoints.set(name, manager);

        // 如果是第一个注册的端点，设置为默认端点
        if (this.endpoints.size === 1) {
            this.defaultEndpoint = name;
        }    
    }

    /**
     * 设置默认端点
     * @param name 端点名称
     */
    public static setDefaultEndpoint(name: string): void {
        if (this.endpoints.has(name)) {
            this.defaultEndpoint = name;
        } else {
            console.error(`HTTP端点 '${name}' 不存在`);
        }
    }

    /**
     * 获取指定端点的HttpManager
     * @param name 端点名称，如果不提供则使用默认端点
     */
    public static getEndpoint(name?: string): HttpCore {
        const endpointName = name || this.defaultEndpoint;
        const endpoint = this.endpoints.get(endpointName);

        if (!endpoint) {
            throw new Error(`HTTP端点 '${endpointName}' 不存在`);
        }

        return endpoint;
    }

    /**
     * 获取所有已注册的端点名称
     */
    public static getEndpointNames(): string[] {
        return Array.from(this.endpoints.keys());
    }

    /**
     * 设置基础URL
     * @param url 基础URL
     */
    public static setBaseUrl(url: string): void {
        this.getManager().setBaseUrl(url);
    }

    /**
     * 添加请求拦截器
     * @param onFulfilled 成功回调
     * @param onRejected 失败回调
     */
    public static addRequestInterceptor(
        onFulfilled?: (config: HttpRequestOptions) => HttpRequestOptions | Promise<HttpRequestOptions>,
        onRejected?: (error: any) => any,
        name?: string
    ): number {
        return this.getManager(name).addRequestInterceptor(onFulfilled, onRejected);
    }

    /**
     * 添加响应拦截器
     * @param onFulfilled 成功回调
     * @param onRejected 失败回调
     * @param endpointName 端点名称，如果不提供则使用默认端点
     */
    public static addResponseInterceptor(
        onFulfilled?: (response: HttpResponse) => HttpResponse | Promise<HttpResponse>,
        onRejected?: (error: any) => any,
        endpointName?: string
    ): number {
        return this.getManager(endpointName).addResponseInterceptor(onFulfilled, onRejected);
    }

    /**
     * 发送GET请求
     * @param url 请求URL
     * @param params 请求参数
     * @param options 其他选项
     * @param endpointName 端点名称，如果不提供则使用默认端点
     */
    public static get<T = any>(
        url: string,
        params?: Record<string, any>,
        options?: Omit<HttpRequestOptions, 'url' | 'method' | 'data'>,
        endpointName?: string
    ): Promise<HttpResponse<T>> {
        return this.getManager(endpointName).get<T>(url, params, options);
    }

    /**
     * 发送POST请求
     * @param url 请求URL
     * @param data 请求数据
     * @param options 其他选项
     * @param endpointName 端点名称，如果不提供则使用默认端点
     */
    public static post<T = any>(
        url: string,
        data?: any,
        options?: Omit<HttpRequestOptions, 'url' | 'method' | 'data'>,
        endpointName?: string
    ): Promise<HttpResponse<T>> {
        return this.getManager(endpointName).post<T>(url, data, options);
    }

    /**
     * 发送PUT请求
     * @param url 请求URL
     * @param data 请求数据
     * @param options 其他选项
     * @param endpointName 端点名称，如果不提供则使用默认端点
     */
    public static put<T = any>(
        url: string,
        data?: any,
        options?: Omit<HttpRequestOptions, 'url' | 'method' | 'data'>,
        endpointName?: string
    ): Promise<HttpResponse<T>> {
        return this.getManager(endpointName).put<T>(url, data, options);
    }

    /**
     * 发送DELETE请求
     * @param url 请求URL
     * @param data 请求数据
     * @param options 其他选项
     * @param endpointName 端点名称，如果不提供则使用默认端点
     */
    public static delete<T = any>(
        url: string,
        data?: any,
        options?: Omit<HttpRequestOptions, 'url' | 'method' | 'data'>,
        endpointName?: string
    ): Promise<HttpResponse<T>> {
        return this.getManager(endpointName).delete<T>(url, data, options);
    }

}