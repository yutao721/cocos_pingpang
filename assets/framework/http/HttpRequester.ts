
/**
 * HTTP请求方法枚举
 */
export enum HttpMethod {
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    DELETE = 'DELETE'
}

/**
 * HTTP请求参数接口
 */
export interface HttpRequestOptions {
    url: string;
    method?: HttpMethod;
    data?: any;
    headers?: Record<string, string>;
    timeout?: number;
    responseType?: XMLHttpRequestResponseType;
    onProgress?: (loaded: number, total: number) => void;
    abortSignal?: AbortSignal;
}

/**
 * HTTP响应接口
 */
export interface HttpResponse<T = any> {
    data: T;
    status: number;
    headers: Record<string, string>;
    config: HttpRequestOptions;
}

/**
 * HTTP服务类 - 用于处理HTTP请求
 */
export class HttpRequester {
    private defaultTimeout: number = 10000; // 默认超时时间：10秒
    private defaultHeaders: Record<string, string> = {
        'Content-Type': 'application/json'
    };

    /**
     * 发送HTTP请求
     * @param options 请求选项
     */
    public request<T = any>(options: HttpRequestOptions): Promise<HttpResponse<T>> {
        const { 
            url, 
            method = HttpMethod.GET, 
            data = null, 
            headers = {}, 
            timeout = this.defaultTimeout,
            responseType = 'json',
            onProgress = null,
            abortSignal = null
        } = options;

        return new Promise<HttpResponse<T>>((resolve, reject) => {

            let requestUrl = url;

            if (method === HttpMethod.GET && data && typeof data === 'object') {
                requestUrl = this.buildQueryUrl(url, data);
            }
            
            const xhr = new XMLHttpRequest();
            xhr.open(method, requestUrl, true);
            xhr.responseType = responseType;
            xhr.timeout = timeout;

            // 设置请求头
            const mergedHeaders = { ...this.defaultHeaders, ...headers };
            Object.keys(mergedHeaders).forEach(key => {
                xhr.setRequestHeader(key, mergedHeaders[key]);
            });

            // 进度回调
            if (onProgress && typeof onProgress === 'function') {
                xhr.onprogress = (event) => {
                    if (event.lengthComputable) {
                        onProgress(event.loaded, event.total);
                    }
                };
            }

            // 中止请求支持
            if (abortSignal) {
                abortSignal.addEventListener('abort', () => {
                    xhr.abort();
                    reject(new Error('Request aborted'));
                });
            }

            // 请求完成回调
            xhr.onreadystatechange = () => {
                if (xhr.readyState !== 4) return;

                // 解析响应头
                const responseHeaders: Record<string, string> = {};
                const headerString = xhr.getAllResponseHeaders();
                const headerPairs = headerString.split('\r\n');
                
                headerPairs.forEach(headerPair => {
                    const index = headerPair.indexOf(': ');
                    if (index > 0) {
                        const key = headerPair.substring(0, index);
                        const value = headerPair.substring(index + 2);
                        responseHeaders[key] = value;
                    }
                });

                // 处理响应
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve({
                        data: xhr.response,
                        status: xhr.status,
                        headers: responseHeaders,
                        config: options
                    });
                } else {
                    reject({
                        data: xhr.response,
                        status: xhr.status,
                        headers: responseHeaders,
                        config: options,
                        message: `Request failed with status code ${xhr.status}`
                    });
                }
            };

            // 错误处理
            xhr.onerror = () => {
                reject({
                    data: null,
                    status: 0,
                    headers: {},
                    config: options,
                    message: 'Network Error'
                });
            };

            xhr.ontimeout = () => {
                reject({
                    data: null,
                    status: 0,
                    headers: {},
                    config: options,
                    message: `Timeout of ${timeout}ms exceeded`
                });
            };

            // 发送请求
            if (method === HttpMethod.GET || !data) {
                xhr.send();
            } else {
                let sendData = data;
                if (typeof data === 'object' && !(data instanceof FormData) && !(data instanceof ArrayBuffer)) {
                    sendData = JSON.stringify(data);
                }
                xhr.send(sendData);
            }
        });
    }

    /**
     * 构建带查询参数的URL
     * @param url 基础URL
     * @param params 查询参数 
     */
    private buildQueryUrl(url: string, params: Record<string, any>): string {
        const queryParts: string[] = [];
        Object.keys(params).forEach(key => {
            const value = params[key];
            if (value === undefined || value === null) return;

            if (Array.isArray(value)) {
                // 生成 tags[]=a&tags[]=b
                value.forEach(item => {
                    queryParts.push(
                        `${encodeURIComponent(key)}[]=${encodeURIComponent(item)}`
                    );
                });
            } else if (typeof value === 'object') {
                // 对象：序列化成 JSON 字符串
                queryParts.push(
                    `${encodeURIComponent(key)}=${encodeURIComponent(JSON.stringify(value))}`
                );
            } else {
                // 普通值
                queryParts.push(
                    `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
                );
            }
        });
        if (queryParts.length === 0) return url;
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}${queryParts.join('&')}`;
    }
}