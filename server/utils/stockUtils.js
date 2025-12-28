const Product = require('../models/product.model');
const StockHistory = require('../models/stockHistory.model');

const changeStock = async ({ session, organizationId, productId, quantityChange, type, referenceId, referenceNumber, note }) => {
    const product = await Product.findOne({ _id: productId, organizationId }).session(session);
    if (!product) throw new Error(`Không tìm thấy sản phẩm ID: ${productId}`);

    if (quantityChange < 0 && product.stock + quantityChange < 0) {
        throw new Error(`SP "${product.name}" không đủ hàng! Tồn: ${product.stock}, Cần: ${Math.abs(quantityChange)}`);
    }

    const newStock = product.stock + quantityChange;
    product.stock = newStock;
    await product.save({ session });

    const history = new StockHistory({
        organizationId, productId: product._id, productName: product.name, sku: product.sku,
        changeAmount: quantityChange, balanceAfter: newStock,
        type, referenceId, referenceNumber, note, date: new Date()
    });
    await history.save({ session });
    return newStock;
};

module.exports = { changeStock };