const User = require("../models/user.model");

/**
 * Marks users created 23.5 hours ago as about to close
 */
const checkForExpiringUsers = async (req, res) => {
  /* 
  Let's say the user is createdAt 10am on Tuesday and will be closed at 10am on Wednesday
  So at 9:30 am on Wednesday, we need to notify to the user that their account is going to be closed
  9:30 am Wednesday - 24h = 9:30 am Tuesday 
  9:30 am Wednesday - 24h + 30m = 9:30 am + 30m Tuesday = 10am Tuesday
  */

  // Calculate the time 23.5 hours ago from the current time
  const notificationTime = new Date(Date.now() - 23.5 * 60 * 60 * 1000);

  // Bulk update users instead of individual updates
  const result = await User.updateMany(
    {
      createdAt: {
        $lte: notificationTime,
      },
      isAboutToClose: { $ne: true },
    },
    { $set: { isAboutToClose: true } }
  );

  if (result.modifiedCount > 0) {
    console.log(`Updated ${result.modifiedCount} users to 'about to close' status.`);
    return res.status(200).json({
      message: `Updated ${result.modifiedCount} users to 'about to close' status.`,
    });
  }
  
  console.log("No users to update.");
  
  return res.status(200).json({ message: "No users to update." });
};

module.exports = checkForExpiringUsers;
