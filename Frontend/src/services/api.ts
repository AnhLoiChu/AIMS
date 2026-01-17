const API_BASE_URL = "http://localhost:3000";

class ApiService {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage on initialization
    this.token = localStorage.getItem("auth_token");
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem("auth_token", token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_info");
  }

  getUser() {
    const userStr = localStorage.getItem("user_info");
    return userStr ? JSON.parse(userStr) : null;
  }

  setUser(user: any) {
    localStorage.setItem("user_info", JSON.stringify(user));
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  async login(
    email: string,
    password: string
  ): Promise<{ token: string; user_id: string; roles: string[] }> {
    const url = `${API_BASE_URL}/auth/login`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        accept: "*/*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error(
        `Login failed: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log("Login response data:", data);
    const token: string | undefined = data.token || data.access_token;
    const roles: string[] = Array.isArray(data.roles) ? data.roles : [];
    const id = data.id || data.user_id;
    if (!token) {
      throw new Error("Login response does not contain a valid token.");
    }
    this.setToken(token);
    console.log("Login successful, token set:", token);
    console.log("User roles:", roles);
    return { token, user_id: id, roles };
  }

  async getProducts(params: {
    limit?: number;
    search?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
  } = {}): Promise<Product[]> {
    const query = new URLSearchParams();
    // Default limit if not provided
    query.append("limit", (params.limit || 30).toString());

    if (params.search) query.append("search", params.search);
    if (params.category && params.category !== "all") query.append("category", params.category);
    if (params.minPrice) query.append("minPrice", params.minPrice.toString());
    if (params.maxPrice) query.append("maxPrice", params.maxPrice.toString());
    if (params.sort) query.append("sort", params.sort);

    return this.request(`/products?${query.toString()}`);
  }

  async getProductDetail(productId: number): Promise<ProductDetail> {
    return this.request(`/products/${productId}`);
  }

  // Cart Management APIs
  async addProductToCart(
    userId: string,
    productId: number,
    quantity: number
  ): Promise<any> {
    return this.request("/product-in-cart/add-product", {
      method: "POST",
      body: JSON.stringify({
        cartId: parseInt(userId),
        productId: productId,
        quantity: quantity,
      }),
    });
  }

  async removeProductFromCart(
    userId: string,
    productId: number,
    quantity: number
  ): Promise<any> {
    return this.request("/product-in-cart/remove-product", {
      method: "POST",
      body: JSON.stringify({
        cartId: parseInt(userId),
        productId: productId,
        quantity: quantity, // Set quantity to 0 to remove the product
      }),
    });
  }

  async viewCart(
    cartId: string
  ): Promise<{ cart_id: number; product_id: number; quantity: number }[]> {
    const data = await this.request(`/cart/view/${cartId}`, {
      method: "GET",
    });
    return data.productInCarts || [];
  }

  async emptyCart(cartId: string): Promise<any> {
    return this.request(`/cart/empty/${cartId}`, {
      method: "POST",
    });
  }

  // Order Management APIs
  async createOrder(
    cartId: number,
    productIds: number[]
  ): Promise<{ order: any; orderDescriptions: any }> {
    return this.request("/order/create", {
      method: "POST",
      body: JSON.stringify({
        cart_id: cartId,
        product_ids: productIds,
      }),
    });
  }



  async createNormalOrderDeliveryInfo(
    orderData: NormalOrderDeliveryInfo
  ): Promise<{
    success: boolean;
    eligibilityMessage?: string;
    updateMessage?: string;
  }> {
    return this.request("/delivery-info/create-normal-order-delivery-info", {
      method: "POST",
      body: JSON.stringify(orderData),
    });
  }
  async createPaymentTransaction(data: {
    order_id: number;
    orderDescription: string;
    orderType: string;
    bankCode?: string;
    language?: string;
    method?: string;
  }): Promise<{ paymentUrl: string; type?: 'REDIRECT' | 'QR_IMAGE' }> {
    const response = await this.request("/payorder/create-payment-url", {
      method: "POST",
      body: JSON.stringify(data),
    });

    // If the response is a redirect, extract the Location header

    // Otherwise, assume the API returns a JSON with paymentUrl
    return response;
  }
  async checkPaymentStatus(orderId: number): Promise<{ success: boolean; data: any }> {
    return this.request(`/payorder/transaction/${orderId}?t=${new Date().getTime()}`, {
      method: "GET",
    });
  }

  async calculateDeliveryFee(data: {
    items: Array<{
      product: { weight: number; dimensions: string; value: number };
      quantity: number;
    }>;
    province: string;
    subtotal: number;
    strategyName?: string;
  }): Promise<{
    baseFee: number;
    additionalFee: number;
    discount: number;
    finalFee: number;
    calculationMethod: string;
    details?: any;
  }> {
    return this.request("/fee-calculation/calculate", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Product Management APIs
  async createProduct(productData: any): Promise<any> {
    return this.request("/products", {
      method: "POST",
      body: JSON.stringify(productData),
    });
  }

  async updateProduct(productId: number, productData: any): Promise<any> {
    return this.request(`/products/${productId}`, {
      method: "PATCH",
      body: JSON.stringify(productData),
    });
  }

  async deleteProducts(productIds: number[]): Promise<any> {
    return this.request("/products/multiple", {
      method: "DELETE",
      body: JSON.stringify({ productIds }),
    });
  }

  // Order History & Management
  async getOrderHistory(userId: string): Promise<any[]> {
    return this.request(`/order/history/${userId}`);
  }

  async getPendingOrders(): Promise<any> {
    return this.request("/order/pending-orders");
  }

  async approveOrder(orderId: string | number, status: 'Shipping' | 'Cancelled'): Promise<any> {
    return this.request(`/order/approve-reject/${orderId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  // Manager/User Management APIs
  async getManagers(): Promise<any[]> {
    return this.request("/administrator/users");
  }

  async getRoles(): Promise<{ role_id: number; name: string }[]> {
    return this.request("/role");
  }

  async createManager(managerData: {
    name: string;
    email: string;
    phone: string;
    password: string;
    roleIds?: number[];
  }): Promise<any> {
    return this.request("/administrator/users", {
      method: "POST",
      body: JSON.stringify(managerData),
    });
  }

  async updateManager(
    userId: number,
    managerData: Partial<{
      name: string;
      email: string;
      phone: string;
      is_active: boolean;
    }>
  ): Promise<any> {
    return this.request(`/administrator/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(managerData),
    });
  }

  async deleteManager(userId: number): Promise<any> {
    return this.request(`/administrator/users/${userId}`, {
      method: "DELETE",
    });
  }

  async resetManagerPassword(userId: number, newPassword: string = "123456"): Promise<any> {
    return this.request(`/administrator/users/${userId}/reset-password`, {
      method: "POST",
      body: JSON.stringify({ newPassword }),
    });
  }
}

export const apiService = new ApiService();

export interface Product {
  product_id: number;
  title: string;
  value: number;
  quantity: number;
  current_price: number;
  category: string;
  manager_id: number;
  creation_date: string;
  barcode: string;
  description: string;
  weight: number;
  dimensions: string;
  type: "book" | "cd" | "dvd" | "news";
  warehouse_entrydate: string;
}

export interface BookDetail {
  book_id: number;
  author: string;
  cover_type: string;
  publisher: string;
  publication_date: string;
  number_of_pages: number;
  language: string;
  genre: string;
}

export interface CDDetail {
  cd_id: number;
  genre: string;
  artist: string;
  record_label: string;
  tracklist: string;
  release_date: string;
}

export interface DVDDetail {
  dvd_id: number;
  language: string;
  subtitles: string;
  runtime: string;
  disc_type: string;
  release_date: string;
  studio: string;
  director: string;
  genre: string;
}

export interface NewsDetail {
  news_id: number;
  editor_in_chief: string;
  publisher: string;
  publication_date: string;
  issue_number: string;
  publication_frequency: string;
  issn: string;
  language: string;
  sections: string;
}

export interface ProductDetail extends Product {
  book?: BookDetail;
  cd?: CDDetail;
  dvd?: DVDDetail;
  news?: NewsDetail;
  // Flat fields from subtypes (backend returns merged object)
  // Book fields
  author?: string;
  cover_type?: string;
  publisher?: string;
  publication_date?: string;
  number_of_pages?: number;
  language?: string;
  genre?: string;
  // CD fields
  artist?: string;
  record_label?: string;
  tracklist?: string;
  release_date?: string;
  // DVD fields
  director?: string;
  runtime?: string;
  studio?: string;
  disc_type?: string;
  subtitles?: string;
  // News fields
  editor_in_chief?: string;
  issue_number?: string;
  publication_frequency?: string;
  issn?: string;
  sections?: string;
}



export interface NormalOrderDeliveryInfo {
  order_id: number;
  recipient_name: string;
  email: string;
  phone: string;
  province: string;
  address: string;
}
