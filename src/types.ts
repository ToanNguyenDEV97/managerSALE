// FIX: Import React to resolve namespace errors for React types like Dispatch and SetStateAction.
import React from 'react';

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'nhanvien';
  createdAt?: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  costPrice: number; // Giá vốn của sản phẩm
  stock: number;
  vat: number;
}

export interface Category {
  id: string;
  name: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  debt: number; // Công nợ
}
export interface CustomerSnapshot {
  id: string;
  name: string;
  phone: string;
  address: string;
  taxCode?: string; // Quan trọng cho hóa đơn đỏ
}
export interface SupplierSnapshot {
  id: string;
  name: string;
  phone: string;
  address: string;
  taxCode?: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address: string;
  taxCode?: string;
  debt: number; // Công nợ phải trả
}

export interface InvoiceItem {
  productId: string;
  name: string;
  quantity: number;
  price: number; // Giá tại thời điểm bán
  costPrice: number; // Giá vốn tại thời điểm bán
  vat: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customer: CustomerSnapshot;
  issueDate: string; // Ngày xuất hóa đơn
  items: InvoiceItem[];
  totalAmount: number;
  paidAmount: number; // Số tiền đã thanh toán
  status: 'Chưa thanh toán' | 'Đã thanh toán' | 'Quá hạn' | 'Thanh toán một phần';
  orderId?: string; // ID đơn hàng gốc
  deliveryId?: string; // ID phiếu giao hàng
}

export interface PurchaseItem {
  productId: string;
  name: string;
  quantity: number;
  costPrice: number; // Giá nhập
}

export interface Purchase {
  id: string;
  purchaseNumber: string;
  supplier: SupplierSnapshot;
  issueDate: string; // Ngày nhập
  items: PurchaseItem[];
  totalAmount: number;
}

export interface QuoteItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  vat: number;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  customerId: string;
  customerName: string;
  issueDate: string;
  items: QuoteItem[];
  totalAmount: number;
  status: 'Mới' | 'Đã gửi' | 'Đã chuyển đổi';
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  vat: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  issueDate: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'Chờ xử lý' | 'Hoàn thành';
  quoteId?: string; // ID báo giá gốc
}

export interface Delivery {
  id: string;
  deliveryNumber: string;
  invoiceId: string;
  customerId: string;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  issueDate: string; // Ngày tạo phiếu
  deliveryDate: string; // Ngày giao dự kiến
  driverName: string;
  vehicleNumber: string;
  status: 'Chờ giao' | 'Đang giao' | 'Đã giao thành công' | 'Giao thất bại';
  notes: string;
}


export interface CashFlowTransaction {
  id: string;
  transactionNumber: string; // e.g., PT-0001, PC-0001
  type: 'thu' | 'chi';
  date: string;
  amount: number;
  description: string;
  payerReceiverName?: string; // Tên người nộp/nhận
  payerReceiverAddress?: string; // Địa chỉ
  category?: 'Chi phí hoạt động' | 'Trả NCC' | 'Lương' | 'Thu nợ KH' | 'Khác' | 'Chênh lệch kho';
  inputVat?: number;
}

export interface InventoryCheckItem {
    productId: string;
    productName: string;
    productSku: string;
    unit: string;
    stockOnHand: number; // Tồn kho sổ sách
    actualStock: number; // Tồn kho thực tế
    difference: number; // Chênh lệch
    costPrice: number; // Giá vốn tại thời điểm kiểm
}

export interface InventoryCheck {
    id: string;
    checkNumber: string; // Số phiếu
    checkDate: string; // Ngày kiểm
    status: 'Nháp' | 'Hoàn thành';
    items: InventoryCheckItem[];
    notes?: string;
}

export interface Settings {
  companyName: string;
  address: string;
  phone: string;
  email: string;
  logo: string | null; // Base64 string
}


export type Page = 'Dashboard' | 'Sales' | 'Products' | 'Customers' | 'Suppliers' | 'Purchases' | 'Quotes' | 'Orders' | 'Invoices' | 'Delivery' | 'CashFlow' | 'Debt' | 'Reports' | 'Tax' | 'Settings' | 'InventoryChecks' | 'Users' |'OrderCreate';

export type Theme = 'light' | 'dark';

export type ColumnVisibility = {
    [key: string]: boolean;
};

export type AllColumnVisibility = {
    products: ColumnVisibility;
    customers: ColumnVisibility;
    suppliers: ColumnVisibility;
    invoices: ColumnVisibility;
    purchases: ColumnVisibility;
    quotes: ColumnVisibility;
    orders: ColumnVisibility;
    deliveries: ColumnVisibility;
};

export type PageKey = keyof AllColumnVisibility;

export interface AppContextState {
  // State
  currentUser: User | null;
  users: User[];
  products: Product[];
  categories: Category[];
  customers: Customer[];
  suppliers: Supplier[];
  quotes: Quote[];
  orders: Order[];
  invoices: Invoice[];
  purchases: Purchase[];
  deliveries: Delivery[];
  inventoryChecks: InventoryCheck[];
  cashFlowTransactions: CashFlowTransaction[];
  settings: Settings;
  theme: Theme;
  columnVisibility: AllColumnVisibility;
  editingQuote: Quote | 'new' | null;
  editingOrder: Order | 'new' | null;
  editingInvoice: Invoice | 'new' | null;
  editingPurchase: Purchase | 'new' | null;
  editingDelivery: Delivery | 'new' | null;
  editingInventoryCheck: InventoryCheck | 'new' | null;
  payingInvoiceId: string | null;
  payingCustomerId: string | null;
  payingSupplierId: string | null;
  editingTransaction: CashFlowTransaction | 'new-thu' | 'new-chi' | null;
  viewingInvoiceId: string | null;
  printingInvoiceId: string | null;
  printingVoucherId: string | null;
  printingDeliveryId: string | null;
  printingQuoteId: string | null;
  postSaleInvoiceId: string | null;
  invoiceIdForNewDelivery: string | null;
  editingUser: User | 'new' | null;
  isProfileModalOpen: boolean;
  currentPage: Page;
  setCurrentPage: React.Dispatch<React.SetStateAction<Page>>;

  // State Setters & Handlers
  handleSaveUser: (user: Partial<User> & { password?: string }) => Promise<void>;
  handleDeleteUser: (userId: string) => Promise<void>;
  handleUpdateProfile: (currentPassword: string, newPassword: string) => Promise<void>;
  handleSaveProduct: (product: Product) => Promise<void>;
  handleDeleteProduct: (productId: string) => Promise<void>;
  handleDeleteProducts: (productIds: string[]) => Promise<void>;
  handleSaveCategory: (category: Category) => Promise<void>;
  handleDeleteCategory: (categoryId: string) => Promise<void>;
  handleSaveCustomer: (customer: Customer) => Promise<Customer>;
  handleDeleteCustomer: (customerId: string) => Promise<void>;
  handleDeleteCustomers: (customerIds: string[]) => Promise<void>;
  handleSaveSupplier: (supplier: Supplier) => Promise<void>;
  handleDeleteSupplier: (supplierId: string) => Promise<void>;
  handleDeleteSuppliers: (supplierIds: string[]) => Promise<void>;
  handleSavePurchase: (purchaseData: Purchase) => Promise<void>;
  handleDeletePurchase: (purchaseId: string) => Promise<void>;
  handleSaveQuote: (quoteData: Quote) => Promise<void>;
  handleDeleteQuote: (quoteId: string) => Promise<void>;
  handleConvertToOrder: (quoteId: string) => Promise<void>;
  handleSaveOrder: (orderData: Order) => Promise<void>;
  handleDeleteOrder: (orderId: string) => Promise<void>;
  handleConvertToInvoice: (orderId: string) => Promise<void>;
  handleSaveInvoice: (invoiceData: Invoice) => Promise<void>;
  handleRecordPayment: (invoiceId: string, amount: number, updateDebt?: boolean, printAction?: 'voucher' | 'invoice' | 'none') => Promise<void>;
  handleCompleteSale: (saleData: {
    customerId: string;
    items: InvoiceItem[];
    totalAmount: number;
    paymentAmount: number;
    saleType: 'debit' | 'full_payment';
  }) => Promise<Invoice>;
  handlePayAllDebt: (customerId: string) => Promise<void>;
  handlePaySupplierDebt: (supplierId: string, amount: number) => Promise<void>;
  handleSaveDelivery: (deliveryData: Delivery) => Promise<void>;
  handleDeleteDelivery: (deliveryId: string) => Promise<void>;
  handleUpdateDeliveryStatus: (deliveryId: string, status: Delivery['status']) => Promise<void>;
  handleSaveInventoryCheck: (check: InventoryCheck) => Promise<void>;
  handleDeleteInventoryCheck: (checkId: string) => Promise<void>;
  handleSaveCashFlowTransaction: (transaction: CashFlowTransaction) => Promise<void>;
  handleDeleteCashFlowTransaction: (transactionId: string) => Promise<void>;
  handleSaveSettings: (settings: Settings) => Promise<void>;
  setTheme: (theme: Theme) => void;
  handleColumnVisibilityChange: (pageKey: PageKey, columnKey: string, isVisible: boolean) => void;
  
  // Modal controllers
  setEditingQuote: React.Dispatch<React.SetStateAction<Quote | 'new' | null>>;
  setEditingOrder: React.Dispatch<React.SetStateAction<Order | 'new' | null>>;
  setEditingInvoice: React.Dispatch<React.SetStateAction<Invoice | 'new' | null>>;
  setEditingPurchase: React.Dispatch<React.SetStateAction<Purchase | 'new' | null>>;
  setEditingDelivery: React.Dispatch<React.SetStateAction<Delivery | 'new' | null>>;
  setEditingInventoryCheck: React.Dispatch<React.SetStateAction<InventoryCheck | 'new' | null>>;
  setPayingInvoiceId: React.Dispatch<React.SetStateAction<string | null>>;
  setPayingCustomerId: React.Dispatch<React.SetStateAction<string | null>>;
  setPayingSupplierId: React.Dispatch<React.SetStateAction<string | null>>;
  setEditingTransaction: React.Dispatch<React.SetStateAction<CashFlowTransaction | 'new-thu' | 'new-chi' | null>>;
  setViewingInvoiceId: React.Dispatch<React.SetStateAction<string | null>>;
  setPrintingInvoiceId: React.Dispatch<React.SetStateAction<string | null>>;
  setPrintingVoucherId: React.Dispatch<React.SetStateAction<string | null>>;
  setPrintingDeliveryId: React.Dispatch<React.SetStateAction<string | null>>;
  setPrintingQuoteId: React.Dispatch<React.SetStateAction<string | null>>;
  setPostSaleInvoiceId: React.Dispatch<React.SetStateAction<string | null>>;
  setInvoiceIdForNewDelivery: React.Dispatch<React.SetStateAction<string | null>>;
  setEditingUser: React.Dispatch<React.SetStateAction<User | 'new' | null>>;
  setIsProfileModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}