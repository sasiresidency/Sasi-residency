# Google Sheets Integration Setup Guide

This guide will help you set up the Google Sheets integration for your hotel booking system.

## 🚀 Quick Setup (5 Steps)

### Step 1: Create Google Sheet

1. **Go to [sheets.google.com](https://sheets.google.com)**
2. **Create a new spreadsheet**
3. **Name it**: "Thiruchendur_Bookings"
4. **Set up the headers** in row 1:

| A | B | C | D | E | F | G | H | I | J | K |
|---|---|---|---|---|---|---|---|---|---|---|
| ID | Name | Email | Phone | RoomType | CheckIn | CheckOut | Message | Status | BookingDate | Price |

### Step 2: Create Google Apps Script

1. **In your Google Sheet, go to Extensions > Apps Script**
2. **Replace the default code** with this:

```javascript
// Google Apps Script for Thiruchendur Bookings API

// Handle POST requests (new bookings from customer site)
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = JSON.parse(e.postData.contents);
    
    // Validate required fields
    if (!data.name || !data.email || !data.phone || !data.roomType || !data.checkIn || !data.checkOut) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Missing required fields'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Create new booking row
    const row = [
      Date.now(), // ID
      data.name,
      data.email,
      data.phone,
      data.roomType,
      data.checkIn,
      data.checkOut,
      data.message || '',
      'pending', // Default status
      new Date().toISOString(),
      data.price || 0
    ];
    
    // Add to sheet
    sheet.appendRow(row);
    
    // Return success response
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Booking added successfully',
      bookingId: row[0]
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Handle GET requests (admin panel fetching bookings)
function doGet(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = sheet.getDataRange().getValues();
    
    // If no data, return empty array
    if (data.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Get headers and data
    const headers = data[0];
    const bookings = data.slice(1).map(row => {
      const booking = {};
      headers.forEach((header, index) => {
        booking[header] = row[index];
      });
      return booking;
    });
    
    return ContentService.createTextOutput(JSON.stringify(bookings))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Handle PUT requests (update booking status from admin panel)
function doPut(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = JSON.parse(e.postData.contents);
    
    if (!data.bookingId || !data.status) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Missing bookingId or status'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Find and update the booking
    const allData = sheet.getDataRange().getValues();
    const headers = allData[0];
    const idColumnIndex = headers.indexOf('ID');
    const statusColumnIndex = headers.indexOf('Status');
    
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][idColumnIndex] == data.bookingId) {
        sheet.getRange(i + 1, statusColumnIndex + 1).setValue(data.status);
        break;
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Booking status updated'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

3. **Save the script** (Ctrl+S or Cmd+S)

### Step 3: Deploy as Web App

1. **Click "Deploy" > "New deployment"**
2. **Choose "Web app"**
3. **Set these options:**
   - **Execute as**: "Me"
   - **Who has access**: "Anyone"
4. **Click "Deploy"**
5. **Copy the Web App URL** (you'll need this for the next step)

### Step 4: Update Your Website

1. **Open `config.js`** in your website files
2. **Replace `YOUR_GOOGLE_APPS_SCRIPT_URL_HERE`** with your actual Google Apps Script Web App URL
3. **Save the file**

### Step 5: Test the Integration

1. **Open your customer website** (`index.html`)
2. **Fill out the booking form** and submit
3. **Check your Google Sheet** - the booking should appear
4. **Open your admin panel** (`admin/index.html`) - the booking should be visible
5. **Test approve/reject functionality**

## 🔧 Troubleshooting

### Common Issues:

**1. "Failed to submit booking" error**
- Check that your Google Apps Script URL is correct in `config.js`
- Make sure your Google Apps Script is deployed as a web app
- Check that "Who has access" is set to "Anyone"

**2. Bookings not appearing in admin panel**
- Check browser console for errors (F12 > Console)
- Make sure the Google Script URL is correct
- Try refreshing the admin panel

**3. Google Apps Script errors**
- Check the Google Apps Script logs (View > Execution log)
- Make sure your Google Sheet has the correct headers
- Verify the script code is saved properly

### Testing the API:

You can test your Google Apps Script directly:

1. **Open your Google Apps Script URL** in a browser
2. **You should see an empty array `[]`** (no bookings yet)
3. **If you see an error, check your script code**

## 📊 Viewing Your Data

- **Google Sheet**: View all bookings in spreadsheet format
- **Admin Panel**: Manage bookings with a user-friendly interface
- **Export**: Use the "Export Bookings" button in admin panel to download CSV

## 🔒 Security Notes

- Your Google Sheet is accessible to anyone with the link
- Consider making the sheet private and using authentication for production
- The current setup is suitable for demonstration and small-scale use

## 🎉 Success!

Once you've completed these steps, your hotel booking system will be fully functional with:
- ✅ Customer bookings saved to Google Sheets
- ✅ Real-time admin panel updates
- ✅ Booking status management
- ✅ Data export functionality
- ✅ Completely free hosting solution

Your system is now ready for separate hosting on different platforms! 🚀
