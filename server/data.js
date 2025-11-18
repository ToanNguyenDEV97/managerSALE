
let initialProducts = [
  { id: 'prod-1', sku: 'CEM-001', name: 'Xi măng PCB40', category: 'Xi măng', unit: 'Bao', price: 85000, costPrice: 70000, stock: 1500, vat: 10 },
  { id: 'prod-2', sku: 'STL-T06', name: 'Thép ống D6', category: 'Thép', unit: 'Cây', price: 35000, costPrice: 28000, stock: 8000, vat: 8 },
  { id: 'prod-3', sku: 'BRK-T01', name: 'Gạch Tuynel 4 lỗ', category: 'Gạch', unit: 'Viên', price: 1200, costPrice: 900, stock: 50000, vat: 10 },
  { id: 'prod-4', sku: 'SND-C01', name: 'Cát xây tô', category: 'Cát & Đá', unit: 'm3', price: 250000, costPrice: 200000, stock: 200, vat: 10 },
  { id: 'prod-5', sku: 'STN-12', name: 'Đá 1x2', category: 'Cát & Đá', unit: 'm3', price: 320000, costPrice: 260000, stock: 350, vat: 10 },
];

let initialCategories = [
    { id: 'cat-1', name: 'Xi măng' },
    { id: 'cat-2', name: 'Thép' },
    { id: 'cat-3', name: 'Gạch' },
    { id: 'cat-4', name: 'Cát & Đá' },
];

let initialCustomers = [
  { id: 'cust-1', name: 'Công ty TNHH Xây dựng An Phát', phone: '0901234567', address: '123 Lê Lợi, Q.1, TP.HCM', debt: 15500000 },
  { id: 'cust-2', name: 'Anh Bảy - Nhà thầu', phone: '0987654321', address: '456 Nguyễn Trãi, Q.5, TP.HCM', debt: 7250000 },
  { id: 'cust-3', name: 'Cửa hàng VLXD Minh Hùng', phone: '0912345678', address: '789 CMT8, Q.10, TP.HCM', debt: 0 },
  { id: 'cust-4', name: 'Chị Lan - Khách lẻ', phone: '0369852147', address: '321 Xô Viết Nghệ Tĩnh, Bình Thạnh', debt: 1200000 },
];

let initialSuppliers = [
  { id: 'sup-1', name: 'Nhà cung cấp Xi măng Holcim', phone: '02837227227', address: 'KCN Hiệp Phước, Nhà Bè, TP.HCM', taxCode: '0301416527', debt: 150000000 },
  { id: 'sup-2', name: 'Thép Hòa Phát', phone: '02553822822', address: 'KCN Dung Quất, Quảng Ngãi', taxCode: '0101248686', debt: 250000000 },
  { id: 'sup-3', name: 'Gạch ngói Đồng Nai', phone: '02513836102', address: '125A, KCN Biên Hòa, Đồng Nai', taxCode: '3600262141', debt: 0 },
];

let initialQuotes = [
    {
        id: 'quote-1',
        quoteNumber: 'BG-0001',
        customerId: 'cust-1',
        customerName: 'Công ty TNHH Xây dựng An Phát',
        issueDate: '2023-11-05',
        items: [
            { productId: 'prod-2', name: 'Thép ống D6', quantity: 1000, price: 34500, vat: 8 },
            { productId: 'prod-3', name: 'Gạch Tuynel 4 lỗ', quantity: 10000, price: 1150, vat: 10 },
        ],
        totalAmount: 48610000,
        status: 'Đã gửi'
    }
];

let initialOrders = [
    {
        id: 'order-1',
        orderNumber: 'DH-0001',
        customerId: 'cust-2',
        customerName: 'Anh Bảy - Nhà thầu',
        issueDate: '2023-11-06',
        items: [
            { productId: 'prod-1', name: 'Xi măng PCB40', quantity: 50, price: 85000, vat: 10 },
        ],
        totalAmount: 4675000,
        status: 'Chờ xử lý'
    }
];


let initialInvoices = [
    { 
        id: 'inv-1', 
        invoiceNumber: 'HD-0001', 
        customerId: 'cust-1', 
        customerName: 'Công ty TNHH Xây dựng An Phát', 
        issueDate: '2023-10-26', 
        items: [
            { productId: 'prod-1', name: 'Xi măng PCB40', quantity: 100, price: 85000, costPrice: 70000, vat: 10 },
            { productId: 'prod-4', name: 'Cát xây tô', quantity: 10, price: 250000, costPrice: 200000, vat: 10 },
        ], 
        totalAmount: 12100000, 
        paidAmount: 5000000,
        status: 'Thanh toán một phần' 
    },
     { 
        id: 'inv-2', 
        invoiceNumber: 'HD-0002', 
        customerId: 'cust-2', 
        customerName: 'Anh Bảy - Nhà thầu', 
        issueDate: '2023-10-25', 
        items: [
            { productId: 'prod-2', name: 'Thép ống D6', quantity: 200, price: 35000, costPrice: 28000, vat: 8 },
        ], 
        totalAmount: 7560000, 
        paidAmount: 7560000,
        status: 'Đã thanh toán' 
    },
    { 
        id: 'inv-3', 
        invoiceNumber: 'HD-0003', 
        customerId: 'cust-4', 
        customerName: 'Chị Lan - Khách lẻ', 
        issueDate: '2023-11-01', 
        items: [
            { productId: 'prod-3', name: 'Gạch Tuynel 4 lỗ', quantity: 1000, price: 1200, costPrice: 900, vat: 10 },
        ], 
        totalAmount: 1320000,
        paidAmount: 0, 
        status: 'Chưa thanh toán' 
    },
    { 
        id: 'inv-4', 
        invoiceNumber: 'HD-0004', 
        customerId: 'cust-1', 
        customerName: 'Công ty TNHH Xây dựng An Phát', 
        issueDate: '2023-11-02', 
        items: [
            { productId: 'prod-5', name: 'Đá 1x2', quantity: 50, price: 320000, costPrice: 260000, vat: 10 },
        ], 
        totalAmount: 17600000, 
        paidAmount: 10000000,
        status: 'Thanh toán một phần',
        deliveryId: 'del-1'
    }
];

let initialDeliveries = [
    {
        id: 'del-1',
        deliveryNumber: 'PGH-0001',
        invoiceId: 'inv-4',
        customerId: 'cust-1',
        customerName: 'Công ty TNHH Xây dựng An Phát',
        customerAddress: '123 Lê Lợi, Q.1, TP.HCM',
        customerPhone: '0901234567',
        issueDate: '2023-11-02',
        deliveryDate: '2023-11-03',
        driverName: 'Nguyễn Văn A',
        vehicleNumber: '51C-123.45',
        status: 'Đã giao thành công',
        notes: 'Giao hàng trong giờ hành chính.',
    }
];

let initialPurchases = [
    {
        id: 'purch-1',
        purchaseNumber: 'PN-0001',
        supplierId: 'sup-1',
        supplierName: 'Nhà cung cấp Xi măng Holcim',
        issueDate: '2023-10-20',
        items: [
            { productId: 'prod-1', name: 'Xi măng PCB40', quantity: 500, costPrice: 70000 },
        ],
        totalAmount: 35000000,
    },
    {
        id: 'purch-2',
        purchaseNumber: 'PN-0002',
        supplierId: 'sup-2',
        supplierName: 'Thép Hòa Phát',
        issueDate: '2023-10-22',
        items: [
            { productId: 'prod-2', name: 'Thép ống D6', quantity: 1000, costPrice: 28000 },
        ],
        totalAmount: 28000000,
    }
];

let initialInventoryChecks = [];

let initialCashFlowTransactions = [
  { id: 'cf-1', transactionNumber: 'PT-0001', type: 'thu', date: '2023-11-01', amount: 5000000, description: 'Thanh toán hóa đơn HD-0001', payerReceiverName: 'Công ty TNHH Xây dựng An Phát', category: 'Thu nợ KH' },
  { id: 'cf-2', transactionNumber: 'PC-0001', type: 'chi', date: '2023-11-02', amount: 2500000, description: 'Trả lương nhân viên tháng 10', category: 'Lương', inputVat: 0 },
  { id: 'cf-3', transactionNumber: 'PC-0002', type: 'chi', date: '2023-11-03', amount: 850000, description: 'Tiền điện, nước, internet', category: 'Chi phí hoạt động', inputVat: 85000 },
  { id: 'cf-4', transactionNumber: 'PT-0002', type: 'thu', date: '2023-11-04', amount: 10000000, description: 'Thanh toán hóa đơn HD-0004', payerReceiverName: 'Công ty TNHH Xây dựng An Phát', category: 'Thu nợ KH' },
  { id: 'cf-5', transactionNumber: 'PC-0003', type: 'chi', date: '2023-11-05', amount: 55000000, description: 'Nhập hàng xi măng', payerReceiverName: 'Nhà cung cấp Xi măng Holcim', category: 'Trả NCC', inputVat: 5000000 },
];

const db = {
    products: initialProducts,
    categories: initialCategories,
    customers: initialCustomers,
    suppliers: initialSuppliers,
    quotes: initialQuotes,
    orders: initialOrders,
    invoices: initialInvoices,
    purchases: initialPurchases,
    deliveries: initialDeliveries,
    inventoryChecks: initialInventoryChecks,
    cashFlowTransactions: initialCashFlowTransactions,
}

module.exports = db;
