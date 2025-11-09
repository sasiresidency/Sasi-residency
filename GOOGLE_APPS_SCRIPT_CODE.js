// Updated Google Apps Script for Thiruchendur Bookings API
// This version supports both regular requests and JSONP callbacks with proper CORS handling

// Handle GET requests (admin panel fetching bookings)
function doGet(e) {
  try {

    

    
    // Check if this is a status update request (JSONP)
    if (e && e.parameter && e.parameter.action === 'updateStatus') {

      const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
      const data = {
        action: e.parameter.action,
        bookingId: e.parameter.bookingId,
        status: e.parameter.status,
        rejectionReason: e.parameter.rejectionReason,
        rejectionComments: e.parameter.rejectionComments,
        notifyCustomer: e.parameter.notifyCustomer,
        rejectionDate: e.parameter.rejectionDate
      };
      return handleStatusUpdate(sheet, data, e);
    }
    
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = sheet.getDataRange().getValues();
    

    
    // If no data, return empty array
    if (data.length <= 1) {
      const response = JSON.stringify([]);

      return handleResponse(response, e);
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
    

    
    const response = JSON.stringify(bookings);
    return handleResponse(response, e);
      
  } catch (error) {

    const errorResponse = JSON.stringify({
      error: error.toString()
    });
    return handleResponse(errorResponse, e);
  }
}

// Handle POST requests (new bookings from customer site and status updates from admin panel)
function doPost(e) {
  try {

    
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Parse data based on content type
    let data;
    if (e && e.postData && e.postData.contents) {
      // Handle JSON data
      data = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      // Handle FormData (from customer site)
      data = {
        name: e.parameter.name,
        email: e.parameter.email,
        phone: e.parameter.phone,
        roomType: e.parameter.roomType,
        checkIn: e.parameter.checkIn,
        checkOut: e.parameter.checkOut,
        message: e.parameter.message || '',
        price: e.parameter.price || 0
      };
    } else {
      const errorResponse = JSON.stringify({
        success: false,
        error: 'No data received'
      });
      return handleResponse(errorResponse, e);
    }
    
    // Check if this is a status update request from admin panel
    if (data.action === 'updateStatus') {
      return handleStatusUpdate(sheet, data, e);
    }
    
    // Otherwise, handle new booking creation
    return handleNewBooking(sheet, data, e);
    
  } catch (error) {

    const errorResponse = JSON.stringify({
      success: false,
      error: error.toString()
    });
    return handleResponse(errorResponse, e);
  }
}

// Handle new booking creation
function handleNewBooking(sheet, data, e) {
  // Validate required fields
  if (!data.name || !data.email || !data.phone || !data.roomType || !data.checkIn || !data.checkOut) {
    const errorResponse = JSON.stringify({
      success: false,
      error: 'Missing required fields'
    });
    return handleResponse(errorResponse, e);
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
  const successResponse = JSON.stringify({
    success: true,
    message: 'Booking added successfully',
    bookingId: row[0]
  });
  return handleResponse(successResponse, e);
}

// Handle status update from admin panel
function handleStatusUpdate(sheet, data, e) {

  
  if (!data.bookingId || !data.status) {

    const errorResponse = JSON.stringify({
      success: false,
      error: 'Missing bookingId or status'
    });
    return handleResponse(errorResponse, e);
  }
  
  // Find and update the booking
  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];
  const idColumnIndex = headers.indexOf('ID');
  const statusColumnIndex = headers.indexOf('Status');
  
  // Check for rejection columns and add them if they don't exist
  let rejectionReasonColumnIndex = headers.indexOf('Rejection Reason');
  let rejectionCommentsColumnIndex = headers.indexOf('Rejection Comments');
  let rejectionDateColumnIndex = headers.indexOf('Rejection Date');
  
  // Add new columns if they don't exist and this is a rejection
  if (data.status === 'rejected' && (rejectionReasonColumnIndex === -1 || rejectionCommentsColumnIndex === -1 || rejectionDateColumnIndex === -1)) {

    
    if (rejectionReasonColumnIndex === -1) {
      headers.push('Rejection Reason');
      rejectionReasonColumnIndex = headers.length - 1;
      sheet.getRange(1, rejectionReasonColumnIndex + 1).setValue('Rejection Reason');
    }
    
    if (rejectionCommentsColumnIndex === -1) {
      headers.push('Rejection Comments');
      rejectionCommentsColumnIndex = headers.length - 1;
      sheet.getRange(1, rejectionCommentsColumnIndex + 1).setValue('Rejection Comments');
    }
    
    if (rejectionDateColumnIndex === -1) {
      headers.push('Rejection Date');
      rejectionDateColumnIndex = headers.length - 1;
      sheet.getRange(1, rejectionDateColumnIndex + 1).setValue('Rejection Date');
    }
  }
  

  
  if (idColumnIndex === -1 || statusColumnIndex === -1) {

    const errorResponse = JSON.stringify({
      success: false,
      error: 'Required columns (ID, Status) not found in sheet'
    });
    return handleResponse(errorResponse, e);
  }
  
  let found = false;
  for (let i = 1; i < allData.length; i++) {
    const currentId = allData[i][idColumnIndex];

    
    if (currentId == data.bookingId) {

      sheet.getRange(i + 1, statusColumnIndex + 1).setValue(data.status);
      
      // If this is a rejection, also update rejection details
      if (data.status === 'rejected') {
        if (data.rejectionReason && rejectionReasonColumnIndex !== -1) {
          sheet.getRange(i + 1, rejectionReasonColumnIndex + 1).setValue(data.rejectionReason);

        }
        
        if (data.rejectionComments && rejectionCommentsColumnIndex !== -1) {
          sheet.getRange(i + 1, rejectionCommentsColumnIndex + 1).setValue(data.rejectionComments);

        }
        
        if (data.rejectionDate && rejectionDateColumnIndex !== -1) {
          sheet.getRange(i + 1, rejectionDateColumnIndex + 1).setValue(data.rejectionDate);

        }
      }
      
      found = true;
      break;
    }
  }
  
  if (!found) {

    const errorResponse = JSON.stringify({
      success: false,
      error: 'Booking not found'
    });
    return handleResponse(errorResponse, e);
  }
  

  const successResponse = JSON.stringify({
    success: true,
    message: 'Booking status updated successfully'
  });
  return handleResponse(successResponse, e);
}

// Handle PUT requests (legacy support)
function doPut(e) {
  try {

    
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = e && e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
    
    // Convert PUT request to POST format for consistency
    data.action = 'updateStatus';
    return handleStatusUpdate(sheet, data, e);
    
  } catch (error) {

    const errorResponse = JSON.stringify({
      success: false,
      error: error.toString()
    });
    return handleResponse(errorResponse, e);
  }
}

// Helper function to handle JSONP callbacks
function handleResponse(data, e) {
  // Safely check for parameters
  const callback = e && e.parameter && e.parameter.callback;
  
  // For POST requests (booking submissions), always return JSON
  // Only use JSONP for GET requests (admin panel)
  if (e && e.postData && callback) {
    // This is a POST request with callback - return JSON instead of JSONP
    return ContentService.createTextOutput(data)
      .setMimeType(ContentService.MimeType.JSON);
  } else if (callback) {
    // JSONP response - this works for cross-origin GET requests
    const jsonpResponse = callback + '(' + data + ')';
    return ContentService.createTextOutput(jsonpResponse)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  } else {
    // Regular JSON response - will work for same-origin requests
    return ContentService.createTextOutput(data)
      .setMimeType(ContentService.MimeType.JSON);
  }
}






