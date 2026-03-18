# Document Upload Diagnostic Test

## Issue
Documents are successfully returning an ID on upload, but the GET /api/documents/:id endpoint returns 404.

## Test Steps

### 1. Verify MongoDB Connection
```bash
# In backend terminal
mongo
> use signistruct
> db.documents.find({}).pretty()
```
If empty, documents are not being saved to DB.

### 2. Check Upload Response
After uploading a document, check the browser Network tab:
- Copy the `_id` from the POST /documents/upload response
- Note if the response says "success: true"

### 3. Test Direct Database Query
```bash
# Replace DOCUMENT_ID with the _id from upload response
mongo
> use signistruct
> db.documents.findById(ObjectId("PASTE_ID_HERE"))
```

If this returns nothing, the document wasn't saved despite returning success.

### 4. Check Backend Logs
Look for any errors during upload in the terminal running your backend server.

## Likely Causes

1. **MongoDB Connection Issue**
   - Database connection fails after seed data
   - Document creation returns success but transaction rolls back
   - Fix: Check `MONGODB_URI` in `.env`

2. **User ID Mismatch**
   - Document savings with different user ID than fetch
   - Fix: Verify `req.user.id` is consistent

3. **Missing Middleware**
   - `verifyToken` not properly setting `req.user`
   - Fix: Check auth middleware is working

4. **File System/Database Sync Issue**
   - File is saved but database entry fails
   - Fix: Add error logging to uploadDocument controller

## Debug: Add Logging to uploadDocument

Edit `/backend/src/controllers/documentController.js` line 548:

```javascript
static async uploadDocument(req, res) {
  try {
    const userId = req.user.id;
    console.log('Upload attempt - userId:', userId);
    
    // ... rest of code ...
    
    const savedDocument = await newDocument.save();
    console.log('Document saved:', savedDocument._id);
    
    return res.status(201).json({
      // ... response ...
    });
  }
}
```

Then retry upload and check backend terminal output.

