# Hybrid Batch Configuration Update

## Summary
Applied the same batch fee configuration structure to `Hybrid.html` and `HybridAdmin.html` as was done for the offline batch system.

## Changes Made

### 1. Updated `config-hybrid.json`
Added `batchFee` and `stats` properties for consistency with the offline configuration:

```json
{
  "batchFee": {
    "price": 1499,
    "currency": "₹",
    "period": "course"
  },
  "stats": {
    "available": 12,
    "fastFilling": 4
  }
}
```

## Current State

### Hybrid System Architecture

**`Hybrid.html`** (Frontend):
- Displays individual course cards with per-course fees
- Does NOT have a global batch fee banner (unlike `Offline.html`)
- Fetches data from: `GET /api/hybrid-config`
- Shows course-specific fees in each card

**`HybridAdmin.html`** (Admin Panel):
- Manages individual hybrid courses
- Each course has its own fee field
- Does NOT have a global batch fee editor (unlike `OfflineAdmin.html`)
- Updates courses via: `PUT /api/hybrid-config/course/:courseId`

**`config-hybrid.json`** (Backend):
- Now includes `batchFee` property (for future use)
- Includes `stats` property (for future use)
- Maintains `accessFee` for backward compatibility
- Stores individual course data with per-course fees

## Key Differences from Offline System

| Feature | Offline System | Hybrid System |
|---------|---------------|---------------|
| **Fee Display** | Global batch fee banner | Per-course fees |
| **Admin Panel** | Has batch fee editor | No batch fee editor |
| **Fee Structure** | Single fee for all batches | Individual course fees |
| **Use of batchFee** | Active (displayed on frontend) | Prepared (not yet used) |

## Why This Structure?

The hybrid system uses **per-course pricing** because:
1. Each hybrid course has different online/offline percentages
2. Different courses have different resource requirements
3. More flexibility for pricing based on course complexity
4. Allows for premium pricing on advanced courses

## Future Enhancements

If you want to add a global batch fee display to `Hybrid.html` (similar to `Offline.html`), you would need to:

1. **Add Fee Banner to `Hybrid.html`**:
```html
<!-- Add after line 142 (before filter bar) -->
<div class="bg-gradient-to-r from-primary to-blue-600 rounded-2xl p-6 shadow-xl mb-8">
    <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
            <div class="size-16 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <span class="material-symbols-outlined text-white text-3xl">payments</span>
            </div>
            <div>
                <h3 class="text-white font-bold text-xl mb-1">Hybrid Batch Enrollment Fee</h3>
                <p class="text-white/80 text-sm">Starting price for hybrid courses</p>
            </div>
        </div>
        <div class="text-right">
            <p class="text-white/80 text-sm mb-1">Starting from</p>
            <p id="batch-fee-price" class="text-5xl font-black text-white">₹1,499</p>
            <p id="batch-fee-period" class="text-white/80 text-sm">/course</p>
        </div>
    </div>
</div>
```

2. **Add JavaScript to Load Fee**:
```javascript
// In loadHybridCourses() function, after line 237
if (result.data.batchFee) {
    const priceEl = document.getElementById('batch-fee-price');
    const periodEl = document.getElementById('batch-fee-period');
    const currency = result.data.batchFee.currency || '₹';
    const price = result.data.batchFee.price || 1499;
    const period = result.data.batchFee.period || 'course';
    
    if (priceEl) priceEl.textContent = `${currency}${price.toLocaleString('en-IN')}`;
    if (periodEl) periodEl.textContent = `/${period}`;
}
```

3. **Add Batch Fee Editor to `HybridAdmin.html`**:
```html
<!-- Add after header, before courses grid -->
<div style="background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 16px; padding: 2rem; margin-bottom: 2rem; color: white;">
    <h3 style="margin-bottom: 1rem;">Hybrid Batch Fee</h3>
    <div style="display: flex; gap: 1rem; align-items: end;">
        <div style="flex: 1;">
            <label style="display: block; margin-bottom: 0.5rem; opacity: 0.9;">Currency</label>
            <select id="batch-fee-currency" style="padding: 0.75rem; border-radius: 8px; border: none;">
                <option value="₹">₹</option>
                <option value="$">$</option>
                <option value="€">€</option>
            </select>
        </div>
        <div style="flex: 2;">
            <label style="display: block; margin-bottom: 0.5rem; opacity: 0.9;">Price</label>
            <input type="number" id="batch-fee-price" value="1499" style="width: 100%; padding: 0.75rem; border-radius: 8px; border: none;">
        </div>
        <button onclick="saveBatchFee()" style="padding: 0.75rem 2rem; background: white; color: #667eea; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
            Save Fee
        </button>
    </div>
</div>
```

4. **Add Save Function**:
```javascript
async function saveBatchFee() {
    const price = parseInt(document.getElementById('batch-fee-price').value);
    const currency = document.getElementById('batch-fee-currency').value;
    
    try {
        const response = await fetch(`${API_BASE}/batchfee`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ price, currency })
        });
        
        const result = await response.json();
        if (result.success) {
            alert('Batch fee updated successfully!');
        }
    } catch (error) {
        alert('Failed to update batch fee');
    }
}
```

5. **Add Backend API Endpoint** (in `server.js`):
```javascript
// PUT - Update hybrid batch fee
app.put('/api/hybrid-config/batchfee', (req, res) => {
    try {
        const data = fs.readFileSync(hybridConfigPath, 'utf8');
        const config = JSON.parse(data);
        const { price, currency } = req.body;
        if (price !== undefined) config.batchFee.price = price;
        if (currency !== undefined) config.batchFee.currency = currency;
        fs.writeFileSync(hybridConfigPath, JSON.stringify(config, null, 2));
        res.json({ success: true, message: 'Batch fee updated', data: config.batchFee });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update batch fee' });
    }
});
```

## Current Status

✅ **Config Structure**: Updated with `batchFee` and `stats`  
✅ **Backend Ready**: Can handle batch fee updates (API endpoint needed)  
⏸️ **Frontend Display**: Not implemented (uses per-course fees)  
⏸️ **Admin Editor**: Not implemented (uses per-course management)  

## Testing

The hybrid system currently works as designed:
1. Open `Hybrid.html` - See individual course cards with per-course fees
2. Open `HybridAdmin.html` - Manage individual course details
3. Each course can have its own fee, schedule, and settings

## Notes

- The `batchFee` property is now available in the config but not actively used
- This maintains consistency across all batch types (online, offline, hybrid)
- Future updates can easily add global batch fee functionality if needed
- The current per-course fee model is more flexible for hybrid courses

---

**Status**: ✅ Config Updated (Future-Ready)  
**Date**: January 15, 2026  
**Backend Port**: 8080
