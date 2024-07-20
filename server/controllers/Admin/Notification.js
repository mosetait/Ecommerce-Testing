const asyncHandler = require("../../middlewares/asyncHandler");
const Notification = require("../../models/Notification");
const Customer = require("../../models/Customer");


// Function to create and broadcast notification
exports.createNotification = asyncHandler(async (req, res) => {

    const { message, type } = req.body;

    if (!message) {
        return res.status(400).json({
            success: false,
            message: "Message is required."
        });
    }

    // Create a single notification
    const newNotification = await Notification.create({
        message,
        type: type || "info"
    });

    // Update all customers to reference this notification
    await Customer.updateMany({}, { $push: { notifications: newNotification._id } });


    // Optionally, emit a notification event to inform connected clients in real-time
    const io = req.app.get('io');
    io.emit('notification', newNotification);



    return res.status(201).json({
        success: true,
        message: "Notification sent to all customers.",
        notification: newNotification
    });
});




// Function to delete a notification from everywhere
exports.deleteNotification = asyncHandler(async (req, res) => {

    const { notificationId } = req.body;
    
    if (!notificationId) {
        return res.status(400).json({
            success: false,
            message: "Notification ID is required."
        });
    }

    // Find the notification to be deleted
    const deletedNotification = await Notification.findByIdAndDelete({_id: notificationId});

    if (!deletedNotification) {
        return res.status(404).json({
            success: false,
            message: "Notification not found."
        });
    }

    // Remove the notification reference from all customers
    await Customer.updateMany({}, { $pull: { notifications: notificationId } });

    // Emit a notification deletion event to inform connected clients in real-time
    const io = req.app.get('io');
    io.emit('notificationDeleted', deletedNotification);

    return res.status(200).json({
        success: true,
        message: "Notification deleted from everywhere."
    });
});




// Function to update a notification
exports.updateNotification = asyncHandler(async (req, res) => {

    const { message, type , notificationId} = req.body;

    if (!notificationId) {
        return res.status(400).json({
            success: false,
            message: "Notification ID is required."
        });
    }

    // Find the notification by ID
    let notification = await Notification.findById({_id: notificationId});

    if (!notification) {
        return res.status(404).json({
            success: false,
            message: "Notification not found."
        });
    }

    // Update the notification
    notification.message = message || notification.message;
    notification.type = type || notification.type;
    await notification.save();

    // Emit a notificationUpdated event to inform connected clients in real-time
    const io = req.app.get('io');
    io.emit('notificationUpdated', notification);

    return res.status(200).json({
        success: true,
        message: "Notification updated successfully.",
        notification
    });
});