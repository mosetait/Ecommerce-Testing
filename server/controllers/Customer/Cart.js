const Customer = require("../../models/Customer");
const Cart = require("../../models/Cart");
const Product = require("../../models/Product");
const asyncHandler = require("../../middlewares/asyncHandler");
const ErrorHandler = require("../../utils/errorHandler");
const mongoose = require("mongoose")




// add to cart
exports.addToCart = asyncHandler(async (req, res, next) => {
    const { productId, quantity } = req.body;

    // Validate input
    if (!mongoose.Types.ObjectId.isValid(productId) || quantity < 1) {
        return res.status(400).json({ message: 'Invalid input data' });
    }

    // Retrieve customer and cart
    let customer = await Customer.findById({ _id: req.user.id }).populate('cart');

    if (!customer) {
        return next(new ErrorHandler("Customer Not Found", 404));
    }

    let cart = await Cart.findById(customer.cart).populate('items.product');

    if (!cart) {
        // Create a new cart if it doesn't exist
        cart = new Cart({ customer: customer._id, items: [] });
        customer.cart = cart._id;
        await customer.save();
    }

    // Retrieve product
    const product = await Product.findById(productId);

    if (!product) {
        return next(new ErrorHandler("Product Not Found", 404));
    }

    // Check if product is already in the cart
    const existingCartItemIndex = cart.items.findIndex(item => item.product._id.toString() === productId);

    if (existingCartItemIndex > -1) {
        // Update quantity if product already exists in the cart
        cart.items[existingCartItemIndex].quantity = Number(cart.items[existingCartItemIndex].quantity) + Number(quantity);
        cart.items[existingCartItemIndex].price = product?.cuttedPrice;
    } else {
        // Add new product to the cart
        const cartItem = {
            product: product._id,
            quantity,
            price: product?.cuttedPrice
        };
        cart.items.push(cartItem);
    }

    // Save the updated cart
    await cart.save();

    // Repopulate the cart to ensure items are populated
    cart = await Cart.findById(cart._id).populate('items.product');

    // Calculate total price
    const totalPrice = cart.items.reduce((total, item) => {
        const productPrice = Number(item.product?.cuttedPrice?.$numberDecimal);
        return total + productPrice * item.quantity;
    }, 0);

    res.status(200).json({ message: 'Product added to cart', cart, totalPrice: totalPrice.toFixed(2) });
});






// delete from cart
exports.deleteFromCart = asyncHandler(async (req, res, next) => {
    const { productId } = req.body;

    // Validate input
    if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ message: 'Invalid input data' });
    }

    // Retrieve customer and cart
    let customer = await Customer.findById({ _id: req.user.id }).populate('cart');

    if (!customer) {
        return next(new ErrorHandler("Customer Not Found", 404));
    }

    let cart = await Cart.findById(customer.cart).populate('items.product');

    if (!cart) {
        return next(new ErrorHandler("Cart Not Found", 404));
    }

    // Find and remove the product from the cart
    const existingCartItemIndex = cart.items.findIndex(item => item.product._id.toString() === productId);
    if (existingCartItemIndex > -1) {
        cart.items.splice(existingCartItemIndex, 1);
    } else {
        return next(new ErrorHandler("Product Not Found in Cart", 404));
    }

    // Save the updated cart
    await cart.save();

    // Calculate total price
    const totalPrice = cart.items.reduce((total, item) => {
        const productPrice = Number(item.product.cuttedPrice);
        return total + productPrice * item.quantity;
    }, 0);

    res.status(200).json({ message: 'Product removed from cart', cart, totalPrice: totalPrice.toFixed(2) });
});







// Increase quantity in cart
exports.increaseQuantity = asyncHandler(async (req, res, next) => {
    const { productId } = req.body;

    // Validate input
    if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ message: 'Invalid input data' });
    }

    // Retrieve customer and cart
    let customer = await Customer.findById(req.user.id).populate('cart');

    if (!customer) {
        return next(new ErrorHandler("Customer Not Found", 404));
    }

    let cart = await Cart.findById(customer.cart).populate('items.product');

    if (!cart) {
        return next(new ErrorHandler("Cart Not Found", 404));
    }

    // Retrieve product
    const product = await Product.findById(productId);

    if (!product) {
        return next(new ErrorHandler("Product Not Found", 404));
    }

    // Check if product is already in the cart
    const existingCartItem = cart.items.find(item => item.product._id.toString() === productId);

    if (existingCartItem) {
        // Update quantity if product already exists in the cart
        existingCartItem.quantity += 1;
        existingCartItem.price = product.cuttedPrice;
    }

    // Save the updated cart
    await cart.save();

    // Calculate total price
    const totalPrice = cart.items.reduce((total, item) => {
        const productPrice = Number(item.product.cuttedPrice);
        return total + productPrice * item.quantity;
    }, 0);

    res.status(200).json({ message: 'Product quantity increased in cart', cart, items: cart.items, totalPrice: totalPrice.toFixed(2) });
});



// Decrease quantity in cart
exports.decreaseQuantity = asyncHandler(async (req, res, next) => {
    const { productId } = req.body;

    // Validate input
    if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ message: 'Invalid input data' });
    }

    // Retrieve customer and cart
    let customer = await Customer.findById(req.user.id).populate('cart');

    if (!customer) {
        return next(new ErrorHandler("Customer Not Found", 404));
    }

    let cart = await Cart.findById(customer.cart).populate('items.product');

    if (!cart) {
        return next(new ErrorHandler("Cart Not Found", 404));
    }

    // Find the product in the cart
    const existingCartItem = cart.items.find(item => item.product._id.toString() === productId);

    if (existingCartItem) {
        // Check if decreasing quantity would result in a non-positive quantity
        if (existingCartItem.quantity <= 1) {
            return res.status(400).json({ message: 'Quantity cannot be decreased below 1' });
        }

        // Decrease quantity
        existingCartItem.quantity -= 1;
    }

    // Save the updated cart
    await cart.save();

    // Calculate total price
    const totalPrice = cart.items.reduce((total, item) => {
        const productPrice = Number(item.product.cuttedPrice);
        return total + productPrice * item.quantity;
    }, 0);

    res.status(200).json({ message: 'Product quantity decreased in cart', cart, items: cart.items, totalPrice: totalPrice.toFixed(2) });
});







// fetch cart
exports.fetchCustomerCart = asyncHandler(async (req, res) => {
    const cart = await Cart.findOne({ customer: req.user.id })
        .populate('customer') // Populate customer details
        .populate('items.product'); // Populate product details within cart items

    if (!cart) {
        return res.status(404).json({
            message: "Cart Not Found. Please Contact Us.",
            success: false,
        });
    }

    // Calculate total price using product.variations[0].priceIncludingGst
    const totalPrice = cart.items.reduce((total, item) => {
        const productPrice = Number(item.product.cuttedPrice);
        return total + productPrice * item.quantity;
    }, 0);

    return res.status(200).json({
        success: true,
        cart,
        totalPrice: totalPrice.toFixed(2) // Convert to string with two decimal places
    });
});
