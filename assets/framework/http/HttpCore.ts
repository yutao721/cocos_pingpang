import { HttpRequester, HttpMethod, HttpRequestOptions, HttpResponse } from './HttpRequester';

/**
 * 拦截器函数类型
 */
type InterceptorFn<T> = (value: T) => T | Promise<T>;

/**
 * 拦截器接口
 */
interface Interceptor<T> {
  onFulfilled?: InterceptorFn<T>;
  onRejected?: (error: any) => any;
}

/**
 * HTTP管理器类 - 提供拦截器和请求管理
 */
export class HttpCore {
  private httpService: HttpRequester;
  private requestInterceptors: Interceptor<HttpRequestOptions>[] = [];
  private responseInterceptors: Interceptor<HttpResponse>[] = [];
  private baseUrl: string = '';

  constructor() {
    this.httpService = new HttpRequester();
  }

  /**
   * 设置基础URL
   * @param url 基础URL
   */
  public setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  /**
   * 获取基础URL
   */
  public getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * 添加请求拦截器
   * @param onFulfilled 成功回调
   * @param onRejected 失败回调
   * @returns 拦截器ID，用于移除拦截器
   */
  public addRequestInterceptor(
    onFulfilled?: InterceptorFn<HttpRequestOptions>,
    onRejected?: (error: any) => any
  ): number {
    const interceptor: Interceptor<HttpRequestOptions> = { onFulfilled, onRejected };
    this.requestInterceptors.push(interceptor);
    return this.requestInterceptors.length - 1;
  }

  /**
   * 添加响应拦截器
   * @param onFulfilled 成功回调
   * @param onRejected 失败回调
   * @returns 拦截器ID，用于移除拦截器
   */
  public addResponseInterceptor(
    onFulfilled?: InterceptorFn<HttpResponse>,
    onRejected?: (error: any) => any
  ): number {
    const interceptor: Interceptor<HttpResponse> = { onFulfilled, onRejected };
    this.responseInterceptors.push(interceptor);
    return this.responseInterceptors.length - 1;
  }

  /**
   * 移除请求拦截器
   * @param id 拦截器ID
   */
  public removeRequestInterceptor(id: number): void {
    if (id >= 0 && id < this.requestInterceptors.length) {
      this.requestInterceptors[id] = {};
    }
  }

  /**
   * 移除响应拦截器
   * @param id 拦截器ID
   */
  public removeResponseInterceptor(id: number): void {
    if (id >= 0 && id < this.responseInterceptors.length) {
      this.responseInterceptors[id] = {};
    }
  }

  /**
   * 清除所有拦截器
   */
  public clearInterceptors(): void {
    this.requestInterceptors = [];
    this.responseInterceptors = [];
  }

  /**
   * 发送HTTP请求
   * @param options 请求选项
   */
  public async request<T = any>(options: HttpRequestOptions): Promise<HttpResponse<T>> {
    // 合并基础URL
    if (this.baseUrl && !options.url.startsWith('http')) {
      options.url = this.baseUrl + (this.baseUrl.endsWith('/') || options.url.startsWith('/') ? '' : '/') + options.url;
    }

    try {
      // 应用请求拦截器
      let processedOptions = { ...options };
      for (const interceptor of this.requestInterceptors) {
        if (interceptor.onFulfilled) {
          processedOptions = await interceptor.onFulfilled(processedOptions);
        }
      }

      // 发送请求
      const response = await this.httpService.request<T>(processedOptions);

      // 应用响应拦截器
      let processedResponse = { ...response };
      for (const interceptor of this.responseInterceptors) {
        if (interceptor.onFulfilled) {
          processedResponse = await interceptor.onFulfilled(processedResponse);
        }
      }

      return processedResponse;
    } catch (error) {

      // 应用响应拦截器的错误处理
      let processedError = error;
      for (const interceptor of this.responseInterceptors) {
        if (interceptor.onRejected) {
          processedError = await interceptor.onRejected(processedError);
        }
      }

      throw processedError;
    }
  }

  /**
   * GET请求
   * @param url 请求URL
   * @param params URL参数
   * @param options 其他选项
   */
  public get<T = any>(url: string, params?: Record<string, any>, options?: Omit<HttpRequestOptions, 'url' | 'method' | 'data'>): Promise<HttpResponse<T>> {
    return this.request<T>({
      url,
      method: HttpMethod.GET,
      data: params,
      ...options
    });
  }

  /**
   * POST请求
   * @param url 请求URL
   * @param data 请求数据
   * @param options 其他选项
   */
  public post<T = any>(url: string, data?: any, options?: Omit<HttpRequestOptions, 'url' | 'method' | 'data'>): Promise<HttpResponse<T>> {
    return this.request<T>({
      url,
      method: HttpMethod.POST,
      data,
      ...options
    });
  }

  /**
   * PUT请求
   * @param url 请求URL
   * @param data 请求数据
   * @param options 其他选项
   */
  public put<T = any>(url: string, data?: any, options?: Omit<HttpRequestOptions, 'url' | 'method' | 'data'>): Promise<HttpResponse<T>> {
    return this.request<T>({
      url,
      method: HttpMethod.PUT,
      data,
      ...options
    });
  }

  /**
   * DELETE请求
   * @param url 请求URL
   * @param data 请求数据
   * @param options 其他选项
   */
  public delete<T = any>(url: string, data?: any, options?: Omit<HttpRequestOptions, 'url' | 'method' | 'data'>): Promise<HttpResponse<T>> {
    return this.request<T>({
      url,
      method: HttpMethod.DELETE,
      data,
      ...options
    });
  }

}