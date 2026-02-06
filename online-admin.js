// Online Admin JavaScript
// Backend Integration for Online Batch Management

const BACKEND_URL = 'http://localhost:8080/api/online-config';
let currentConfig = null;

// ==================
// UTILITY FUNCTIONS
// ==================

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white font-medium animate-slide-in`;
    toast.innerHTML = `
        <span class="material-symbols-outlined">${type === 'success' ? 'check_circle' : 'error'}</span>
        <span>${message}</span>
    `;
    document.getElementById('toast-container').appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ==================
// FETCH CONFIGURATION
// ==================

async function fetchConfig() {
    try {
        const response = await fetch(BACKEND_URL);
        const result = await response.json();

        if (result.success) {
            currentConfig = result.data;
            updateUI(currentConfig);
        } else {
            showToast('Failed to load configuration', 'error');
        }
    } catch (error) {
        console.error('Error fetching config:', error);
        showToast('Backend server not running', 'error');
    }
}

function updateUI(data) {
    // Update statistics
    document.getElementById('stat-courses').textContent = data.courses?.length || 0;
    document.getElementById('stat-batches').textContent = data.batches?.length || 0;
    document.getElementById('stat-fee').textContent = `₹${(data.price || 0).toLocaleString('en-IN')}`;
    document.getElementById('stat-requests').textContent = '0'; // Will be updated when requests API is ready

    // Update access fee editor
    document.getElementById('fee-title').value = data.title || '';
    document.getElementById('fee-description').value = data.description || '';
    document.getElementById('fee-price').value = data.price || 0;
    document.getElementById('fee-period').value = data.period || 'month';

    // Render courses
    renderCourses(data.courses || []);

    // Render batches
    renderBatches(data.courses || [], data.batches || []);

    // Render Detailed Batches (New System)
    renderDetailedBatchesAdmin(data.batchesDetailed || []);

    // Populate course dropdown in add batch modal
    populateCourseDropdown(data.courses || []);
}

// ==================
// ACCESS FEE MANAGEMENT
// ==================

async function saveAccessFee() {
    const title = document.getElementById('fee-title').value;
    const description = document.getElementById('fee-description').value;
    const price = parseInt(document.getElementById('fee-price').value);
    const period = document.getElementById('fee-period').value;

    if (!title || !description || !price) {
        showToast('Please fill all fields', 'error');
        return;
    }

    try {
        const response = await fetch(`${BACKEND_URL}/accessfee`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description, price, period })
        });

        const result = await response.json();
        if (result.success) {
            showToast('Access fee updated successfully!');
            fetchConfig();
        } else {
            showToast('Failed to update access fee', 'error');
        }
    } catch (error) {
        console.error('Error saving access fee:', error);
        showToast('Backend server not running', 'error');
    }
}

// ==================
// COURSE MANAGEMENT
// ==================

function renderCourses(courses) {
    const container = document.getElementById('courses-container');

    if (!courses || courses.length === 0) {
        container.innerHTML = '<p class="col-span-full text-center text-slate-400 py-8">No courses available. Add your first course!</p>';
        return;
    }

    container.innerHTML = courses.map(course => `
        <div class="bg-slate-800 rounded-lg border border-slate-700 p-4 hover:border-primary transition-colors">
            <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                    <div class="size-10 rounded-lg bg-${course.color}-100 dark:bg-${course.color}-900/30 flex items-center justify-center">
                        <span class="material-symbols-outlined text-${course.color}-600 dark:text-${course.color}-400">${course.icon || 'school'}</span>
                    </div>
                    <div>
                        <input type="text" id="name-${course.id}" value="${course.name}" 
                            class="font-bold text-white bg-transparent border-b border-transparent hover:border-slate-600 focus:border-primary focus:outline-none px-1">
                        <p class="text-xs text-slate-400">${course.batchCount || 0} batches</p>
                    </div>
                </div>
            </div>
            <div class="space-y-2">
                <div class="grid grid-cols-2 gap-2">
                    <div>
                        <label class="text-xs text-slate-400">Price (₹)</label>
                        <input type="number" id="price-${course.id}" value="${course.price}" 
                            class="w-full px-2 py-1 bg-slate-900 border border-slate-600 rounded text-sm text-white focus:border-primary focus:outline-none">
                    </div>
                    <div>
                        <label class="text-xs text-slate-400">Duration</label>
                        <div class="flex gap-1">
                            <input type="number" id="duration-val-${course.id}" 
                                value="${parseInt(course.duration) || 0}" 
                                class="w-1/2 px-2 py-1 bg-slate-900 border border-slate-600 rounded text-sm text-white focus:border-primary focus:outline-none">
                            <select id="duration-unit-${course.id}" 
                                class="w-1/2 px-1 py-1 bg-slate-900 border border-slate-600 rounded text-xs text-white focus:border-primary focus:outline-none">
                                <option value="Months" ${course.duration.includes('Months') ? 'selected' : ''}>Months</option>
                                <option value="Weeks" ${course.duration.includes('Weeks') ? 'selected' : ''}>Weeks</option>
                                <option value="Days" ${course.duration.includes('Days') ? 'selected' : ''}>Days</option>
                                <option value="Hours" ${course.duration.includes('Hours') ? 'selected' : ''}>Hours</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-2">
                    <div>
                        <label class="text-xs text-slate-400">Icon</label>
                        <input type="text" id="icon-${course.id}" value="${course.icon || 'school'}" 
                            class="w-full px-2 py-1 bg-slate-900 border border-slate-600 rounded text-sm text-white focus:border-primary focus:outline-none">
                    </div>
                    <div>
                        <label class="text-xs text-slate-400">Color</label>
                        <select id="color-${course.id}" 
                            class="w-full px-2 py-1 bg-slate-900 border border-slate-600 rounded text-sm text-white focus:border-primary focus:outline-none">
                            <option value="blue" ${course.color === 'blue' ? 'selected' : ''}>Blue</option>
                            <option value="orange" ${course.color === 'orange' ? 'selected' : ''}>Orange</option>
                            <option value="green" ${course.color === 'green' ? 'selected' : ''}>Green</option>
                            <option value="purple" ${course.color === 'purple' ? 'selected' : ''}>Purple</option>
                            <option value="red" ${course.color === 'red' ? 'selected' : ''}>Red</option>
                            <option value="yellow" ${course.color === 'yellow' ? 'selected' : ''}>Yellow</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="flex gap-2 mt-3">
                <button onclick="saveCourse('${course.id}')" 
                    class="flex-1 py-2 bg-primary hover:bg-primary-dark text-white font-semibold rounded transition-colors text-sm">
                    Save
                </button>
                <button onclick="deleteCourse('${course.id}')" 
                    class="px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded transition-colors">
                    <span class="material-symbols-outlined text-[18px]">delete</span>
                </button>
            </div>
        </div>
    `).join('');
}

async function saveCourse(courseId) {
    const name = document.getElementById(`name-${courseId}`).value;
    const price = parseInt(document.getElementById(`price-${courseId}`).value);

    // Combine duration parts
    const durVal = document.getElementById(`duration-val-${courseId}`).value;
    const durUnit = document.getElementById(`duration-unit-${courseId}`).value;
    const duration = `${durVal} ${durUnit}`;

    const icon = document.getElementById(`icon-${courseId}`).value;
    const color = document.getElementById(`color-${courseId}`).value;

    try {
        const response = await fetch(`${BACKEND_URL}/course/${courseId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, price, duration, icon, color })
        });

        const result = await response.json();
        if (result.success) {
            showToast(`${name} updated successfully!`);
            fetchConfig();
        } else {
            showToast('Failed to update course', 'error');
        }
    } catch (error) {
        console.error('Error saving course:', error);
        showToast('Backend server not running', 'error');
    }
}

async function deleteCourse(courseId) {
    if (!confirm('Are you sure you want to delete this course? This will also delete all associated batches.')) {
        return;
    }

    try {
        const response = await fetch(`${BACKEND_URL}/course/${courseId}`, {
            method: 'DELETE'
        });

        const result = await response.json();
        if (result.success) {
            showToast('Course deleted successfully!');
            fetchConfig();
        } else {
            showToast('Failed to delete course', 'error');
        }
    } catch (error) {
        console.error('Error deleting course:', error);
        showToast('Backend server not running', 'error');
    }
}

// Add Course Modal
function showAddCourseModal() {
    document.getElementById('addCourseModal').classList.remove('hidden');
    document.getElementById('addCourseModal').classList.add('flex');
}

function closeAddCourseModal() {
    document.getElementById('addCourseModal').classList.add('hidden');
    document.getElementById('addCourseModal').classList.remove('flex');
}

async function addCourse() {
    const name = document.getElementById('course-name').value.trim();
    const price = parseInt(document.getElementById('course-price').value);
    const duration = document.getElementById('course-duration').value;
    const icon = document.getElementById('course-icon').value;
    const color = document.getElementById('course-color').value;

    if (!name) {
        showToast('Course name is required', 'error');
        return;
    }

    try {
        const response = await fetch(`${BACKEND_URL}/course`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, price, duration, icon, color })
        });

        const result = await response.json();
        if (result.success) {
            showToast('Course added successfully!');
            closeAddCourseModal();
            fetchConfig();
        } else {
            showToast(result.message || 'Failed to add course', 'error');
        }
    } catch (error) {
        console.error('Error adding course:', error);
        showToast('Backend server not running', 'error');
    }
}

// ==================
// BATCH MANAGEMENT
// ==================

function renderBatches(courses, batches) {
    const container = document.getElementById('batches-container');

    if (!courses || courses.length === 0) {
        container.innerHTML = '<p class="text-center text-slate-400 py-8">Add courses first to create batches</p>';
        return;
    }

    const groupedBatches = {};
    courses.forEach(course => {
        groupedBatches[course.id] = batches.filter(b => b.courseId === course.id);
    });

    container.innerHTML = courses.map(course => {
        const courseBatches = groupedBatches[course.id] || [];
        return `
            <div class="bg-slate-800 rounded-lg border border-slate-700 p-4">
                <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-2">
                        <div class="size-8 rounded-lg bg-${course.color}-100 dark:bg-${course.color}-900/30 flex items-center justify-center">
                            <span class="material-symbols-outlined text-${course.color}-600 dark:text-${course.color}-400 text-[20px]">${course.icon || 'school'}</span>
                        </div>
                        <div>
                            <h4 class="font-bold text-white">${course.name}</h4>
                            <p class="text-xs text-slate-400">${courseBatches.length} batches</p>
                        </div>
                    </div>
                </div>
                <div class="grid grid-cols-7 gap-2">
                    ${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
            const dayBatches = courseBatches.filter(b => b.day === day);
            return `
                            <div class="text-center">
                                <p class="text-xs text-slate-400 mb-1">${day}</p>
                                ${dayBatches.map(batch => `
                                    <div class="bg-slate-900 rounded p-2 mb-1 hover:bg-slate-700 cursor-pointer transition-colors group" onclick="editBatch('${batch.id}')">
                                        <p class="text-xs font-semibold text-white">${batch.startTime}</p>
                                        <p class="text-[10px] text-slate-400">${batch.faculty}</p>
                                        <button onclick="event.stopPropagation(); deleteBatch('${batch.id}')" class="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 text-[10px] mt-1">
                                            <span class="material-symbols-outlined text-[12px]">delete</span>
                                        </button>
                                    </div>
                                `).join('')}
                                ${dayBatches.length === 0 ? `
                                    <div class="h-12 bg-slate-900/30 rounded border border-dashed border-slate-700 hover:border-primary hover:bg-primary/10 cursor-pointer transition-all flex items-center justify-center group" 
                                         onclick="quickAddBatch('${course.id}', '${day}')"
                                         title="Click to add batch">
                                        <span class="material-symbols-outlined text-slate-600 group-hover:text-primary text-[16px]">add</span>
                                    </div>
                                ` : ''}
                            </div>
                        `;
        }).join('')}
                </div>
            </div>
        `;
    }).join('');
}

function populateCourseDropdown(courses) {
    const select = document.getElementById('batch-course');
    select.innerHTML = '<option value="">Select Course</option>' +
        courses.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}

function showAddBatchModal() {
    document.getElementById('addBatchModal').classList.remove('hidden');
    document.getElementById('addBatchModal').classList.add('flex');
}

function closeAddBatchModal() {
    document.getElementById('addBatchModal').classList.add('hidden');
    document.getElementById('addBatchModal').classList.remove('flex');
}

async function addBatch() {
    const courseId = document.getElementById('batch-course').value;
    const faculty = document.getElementById('batch-faculty').value.trim();
    const day = document.getElementById('batch-day').value;
    const startTime = document.getElementById('batch-start').value;
    const endTime = document.getElementById('batch-end').value;
    const duration = document.getElementById('batch-duration').value;

    if (!courseId || !faculty || !startTime || !endTime) {
        showToast('Please fill all required fields', 'error');
        return;
    }

    // Check if we're editing an existing batch
    const editingBatchId = document.getElementById('addBatchModal').dataset.editingBatchId;

    // Get current batches
    const currentBatches = currentConfig?.batches || [];

    let updatedBatches;

    if (editingBatchId) {
        // Update existing batch
        updatedBatches = currentBatches.map(batch => {
            if (batch.id === editingBatchId) {
                return {
                    ...batch,
                    courseId,
                    faculty,
                    day,
                    startTime,
                    endTime,
                    duration: `${duration} Hours`
                };
            }
            return batch;
        });
    } else {
        // Create new batch
        const batchId = `batch-${courseId}-${day}-${Date.now()}`;
        const newBatch = {
            id: batchId,
            courseId,
            faculty,
            day,
            startTime,
            endTime,
            duration: `${duration} Hours`,
            enrolledStudents: 0,
            maxStudents: 30,
            status: 'active'
        };
        updatedBatches = [...currentBatches, newBatch];
    }

    try {
        const response = await fetch(`${BACKEND_URL}/batches`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ batches: updatedBatches })
        });

        const result = await response.json();
        if (result.success) {
            showToast(editingBatchId ? 'Batch updated successfully!' : 'Batch added successfully!');
            closeAddBatchModal();
            // Clear form and editing state
            document.getElementById('batch-faculty').value = '';
            document.getElementById('batch-start').value = '';
            document.getElementById('batch-end').value = '';
            delete document.getElementById('addBatchModal').dataset.editingBatchId;
            fetchConfig();
        } else {
            showToast(result.message || 'Failed to save batch', 'error');
        }
    } catch (error) {
        console.error('Error saving batch:', error);
        showToast('Backend server not running', 'error');
    }
}

// Quick Add Batch - Opens modal with pre-filled course and day
function quickAddBatch(courseId, day) {
    // Pre-fill the modal
    document.getElementById('batch-course').value = courseId;
    document.getElementById('batch-day').value = day;
    showAddBatchModal();
}

// Delete Batch
async function deleteBatch(batchId) {
    if (!confirm('Are you sure you want to delete this batch?')) {
        return;
    }

    try {
        // Get current batches
        const currentBatches = currentConfig?.batches || [];

        // Remove the batch
        const updatedBatches = currentBatches.filter(b => b.id !== batchId);

        const response = await fetch(`${BACKEND_URL}/batches`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ batches: updatedBatches })
        });

        const result = await response.json();
        if (result.success) {
            showToast('Batch deleted successfully!');
            fetchConfig();
        } else {
            showToast('Failed to delete batch', 'error');
        }
    } catch (error) {
        console.error('Error deleting batch:', error);
        showToast('Backend server not running', 'error');
    }
}

// ==================
// DETAILED BATCH MANAGEMENT
// ==================

// ==================
// DETAILED BATCH MANAGEMENT (Local Storage)
// ==================

let detailedBatchFilter = 'all';

// Load initial batches from Store
function loadDetailedBatchesFromStore() {
    if (!window.BatchStore) return;
    const batches = window.BatchStore.getAll('ONLINE');
    // detailed batches are mixed into the config object for now to keep structure consistent
    if (!currentConfig) currentConfig = {};
    currentConfig.batchesDetailed = batches;
    renderDetailedBatchesAdmin(batches);
}

// Hook into fetchConfig to load local batches too
const originalFetchConfig = fetchConfig;
fetchConfig = async function () {
    await originalFetchConfig();
    loadDetailedBatchesFromStore(); // Override detailed batches with local store
}

function renderDetailedBatchesAdmin(batches) {
    const container = document.getElementById('detailed-batches-container');
    const filter = document.getElementById('detailed-batch-status-filter').value;

    let filteredBatches = batches || [];
    if (filter !== 'all') {
        filteredBatches = filteredBatches.filter(b => b.status === filter);
    }

    if (filteredBatches.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="7" class="px-4 py-8 text-center text-slate-400">
                    <span class="material-symbols-outlined text-3xl mb-2">event_busy</span>
                    <p>No ${filter !== 'all' ? filter : ''} batches found</p>
                </td>
            </tr>
        `;
        return;
    }

    container.innerHTML = filteredBatches.map(batch => {
        let statusColor = 'bg-slate-700 text-slate-300';
        if (batch.status === 'upcoming') statusColor = 'bg-blue-900/50 text-blue-400 border border-blue-800';
        else if (batch.status === 'running') statusColor = 'bg-green-900/50 text-green-400 border border-green-800';
        else if (batch.status === 'past') statusColor = 'bg-gray-700 text-gray-400 border border-gray-600';

        // Calculate progress (Mock logic if modules missing)
        const totalTopics = batch.modules ? batch.modules.reduce((acc, m) => acc + m.topics.length, 0) : 0;
        const completedTopics = batch.modules ? batch.modules.reduce((acc, m) => acc + m.topics.filter(t => t.completed).length, 0) : 0;
        const progress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

        return `
            <tr class="hover:bg-slate-800/50 transition-colors border-b border-gray-800 last:border-0">
                <td class="px-4 py-3">
                    <p class="font-bold text-white">${batch.name}</p>
                    <p class="text-xs text-slate-500">ID: ${batch.id}</p>
                </td>
                <td class="px-4 py-3 text-sm text-slate-300">
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-[16px]">person</span>
                        ${batch.instructor}
                    </div>
                </td>
                <td class="px-4 py-3">
                    <p class="text-xs text-slate-300">${batch.schedule}</p>
                    <p class="text-[10px] text-slate-500">${batch.startDate} - ${batch.endDate}</p>
                </td>
                <td class="px-4 py-3">
                    <span class="px-2 py-1 rounded text-xs font-semibold ${statusColor} capitalize">
                        ${batch.status}
                    </span>
                </td>
                <td class="px-4 py-3 text-sm text-slate-300">
                    ${batch.enrolled}/${batch.capacity}
                </td>
                <td class="px-4 py-3">
                    <div class="flex items-center gap-2">
                        <div class="flex-1 h-1.5 bg-slate-700 rounded-full w-20">
                            <div class="h-1.5 bg-green-500 rounded-full" style="width: ${progress}%"></div>
                        </div>
                        <span class="text-xs text-slate-400">${progress}%</span>
                    </div>
                </td>
                <td class="px-4 py-3">
                    <div class="flex items-center gap-2">
                         <button onclick="manageCurriculum('${batch.id}')" 
                             class="p-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded transition-colors" 
                             title="Manage Curriculum">
                             <span class="material-symbols-outlined text-[18px]">menu_book</span>
                         </button>
                         <button onclick="editDetailedBatch('${batch.id}')" 
                             class="p-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors" 
                             title="Edit Batch">
                             <span class="material-symbols-outlined text-[18px]">edit</span>
                         </button>
                         <button onclick="deleteDetailedBatch('${batch.id}')" 
                             class="p-1.5 bg-red-900/20 hover:bg-red-600 text-red-400 hover:text-white rounded transition-colors" 
                             title="Delete Batch">
                             <span class="material-symbols-outlined text-[18px]">delete</span>
                         </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function filterDetailedBatchesAdmin() {
    // Reload from store to ensure fresh state, then filter
    const batches = window.BatchStore.getAll('ONLINE');
    renderDetailedBatchesAdmin(batches);
}

// Modal Functions
function showAddDetailedBatchModal() {
    document.getElementById('detailedBatchModal').classList.remove('hidden');
    document.getElementById('detailedBatchModal').classList.add('flex');
    document.getElementById('detailedModalTitle').textContent = 'Add Detailed Batch';

    // Clear form
    document.getElementById('detailedBatchForm').reset();
    document.getElementById('detailed-batch-status').value = 'upcoming';
    document.getElementById('detailed-batch-capacity').value = 50;

    delete document.getElementById('detailedBatchModal').dataset.editingId;
}

function closeDetailedBatchModal() {
    document.getElementById('detailedBatchModal').classList.add('hidden');
    document.getElementById('detailedBatchModal').classList.remove('flex');
}

function editDetailedBatch(batchId) {
    const batches = window.BatchStore.getAll('ONLINE');
    const batch = batches.find(b => b.id === batchId);
    if (!batch) return;

    document.getElementById('detailedBatchModal').classList.remove('hidden');
    document.getElementById('detailedBatchModal').classList.add('flex');
    document.getElementById('detailedModalTitle').textContent = 'Edit Detailed Batch';

    // Fill form
    document.getElementById('detailed-batch-name').value = batch.name;
    document.getElementById('detailed-batch-instructor').value = batch.instructor;
    document.getElementById('detailed-batch-status').value = batch.status;
    document.getElementById('detailed-batch-capacity').value = batch.capacity;
    document.getElementById('detailed-batch-start-date').value = batch.startDate;
    document.getElementById('detailed-batch-end-date').value = batch.endDate;
    document.getElementById('detailed-batch-schedule').value = batch.schedule;

    // Show enrolled field if editing
    document.getElementById('enrolled-field-container').classList.remove('hidden');
    document.getElementById('detailed-batch-enrolled').value = batch.enrolled || 0;

    document.getElementById('detailedBatchModal').dataset.editingId = batchId;
}

async function saveDetailedBatch() {
    // Collect Data
    const name = document.getElementById('detailed-batch-name').value;
    const instructor = document.getElementById('detailed-batch-instructor').value;
    const status = document.getElementById('detailed-batch-status').value;
    const capacity = parseInt(document.getElementById('detailed-batch-capacity').value);
    const startDate = document.getElementById('detailed-batch-start-date').value;
    const endDate = document.getElementById('detailed-batch-end-date').value;
    const schedule = document.getElementById('detailed-batch-schedule').value;
    const enrolled = parseInt(document.getElementById('detailed-batch-enrolled').value) || 0;

    if (!name || !instructor || !startDate || !endDate || !schedule) {
        showToast('Please fill all required fields', 'error');
        return;
    }

    const editingId = document.getElementById('detailedBatchModal').dataset.editingId;

    let batchData = {
        name, instructor, status, capacity, startDate, endDate, schedule, enrolled
    };

    if (editingId) {
        // preserve other fields like ID and modules
        const existing = window.BatchStore.getAll('ONLINE').find(b => b.id === editingId);
        batchData = { ...existing, ...batchData };
    } else {
        batchData.id = 'batch-on-' + Date.now();
        batchData.modules = [];
        batchData.mode = 'Online';
    }

    try {
        const success = window.BatchStore.save('ONLINE', batchData);

        if (success) {
            showToast(editingId ? 'Batch updated successfully!' : 'Batch created successfully!');
            closeDetailedBatchModal();
            loadDetailedBatchesFromStore(); // Refresh UI
        } else {
            showToast('Failed to save batch locally', 'error');
        }
    } catch (error) {
        console.error('Error saving detailed batch:', error);
        showToast('Error saving batch', 'error');
    }
}

async function deleteDetailedBatch(batchId) {
    if (!confirm('Are you sure you want to delete this batch? All curriculum data will be lost.')) return;

    try {
        const success = window.BatchStore.delete('ONLINE', batchId);

        if (success) {
            showToast('Batch deleted successfully!');
            loadDetailedBatchesFromStore(); // Refresh UI
        } else {
            showToast('Failed to delete batch', 'error');
        }
    } catch (error) {
        console.error('Error deleting batch:', error);
        showToast('Error deleting batch', 'error');
    }
}

// ==================
// CURRICULUM MANAGEMENT
// ==================

let currentEditingBatch = null;
let currentEditingModuleId = null;

function manageCurriculum(batchId) {
    const batch = currentConfig?.batchesDetailed?.find(b => b.id === batchId);
    if (!batch) return;

    // Deep copy to avoid direct mutation until save
    currentEditingBatch = JSON.parse(JSON.stringify(batch));

    document.getElementById('curriculumManagerModal').classList.remove('hidden');
    document.getElementById('curriculumManagerModal').classList.add('flex');
    document.getElementById('curriculum-batch-title').textContent = batch.name;

    renderAdminModules();

    // Select first module if exists
    if (currentEditingBatch.modules && currentEditingBatch.modules.length > 0) {
        selectModule(currentEditingBatch.modules[0].id);
    } else {
        document.getElementById('admin-topics-list').innerHTML = `
            <div class="h-full flex flex-col items-center justify-center text-slate-500">
                <span class="material-symbols-outlined text-4xl mb-2">arrow_back</span>
                <p>Add a module to start managing curriculum</p>
            </div>
        `;
        document.getElementById('section-topics-header').classList.add('hidden');
    }
}

function closeCurriculumManagerModal() {
    saveCurriculumChanges().then(() => {
        document.getElementById('curriculumManagerModal').classList.add('hidden');
        document.getElementById('curriculumManagerModal').classList.remove('flex');
        currentEditingBatch = null;
        currentEditingModuleId = null;
    });
}

function renderAdminModules() {
    const container = document.getElementById('admin-modules-list');

    if (!currentEditingBatch.modules || currentEditingBatch.modules.length === 0) {
        container.innerHTML = '<p class="text-sm text-slate-500 text-center py-4">No modules yet</p>';
        return;
    }

    container.innerHTML = currentEditingBatch.modules.map(module => `
        <div onclick="selectModule('${module.id}')" 
             class="p-3 rounded cursor-pointer transition-colors group flex items-center justify-between ${currentEditingModuleId === module.id ? 'bg-primary text-white' : 'hover:bg-slate-800 text-slate-300'}">
            <div class="flex flex-col overflow-hidden">
                <span class="font-semibold truncate">${module.name}</span>
                <span class="text-xs opacity-70">Module ${module.order} • ${module.status}</span>
            </div>
            <button onclick="event.stopPropagation(); deleteModule('${module.id}')" class="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/20 rounded">
                <span class="material-symbols-outlined text-[16px]">delete</span>
            </button>
        </div>
    `).join('');
}

function selectModule(moduleId) {
    currentEditingModuleId = moduleId;
    renderAdminModules(); // Re-render to update active state
    renderAdminTopics();
}

function renderAdminTopics() {
    const module = currentEditingBatch.modules.find(m => m.id === currentEditingModuleId);
    if (!module) return;

    document.getElementById('section-topics-header').classList.remove('hidden');
    document.getElementById('section-topics-header').classList.add('flex');
    document.getElementById('current-module-name').textContent = module.name;

    const container = document.getElementById('admin-topics-list');

    if (!module.topics || module.topics.length === 0) {
        container.innerHTML = '<p class="text-center text-slate-500 py-8">No topics in this module</p>';
        return;
    }

    container.innerHTML = module.topics.map((topic, index) => `
        <div class="bg-slate-800 rounded p-3 border border-slate-700 hover:border-slate-500 transition-colors">
            <div class="flex items-start gap-3">
                <button onclick="toggleTopicCompletion('${topic.name}')" class="${topic.completed ? 'text-green-500' : 'text-slate-500 hover:text-white'}">
                    <span class="material-symbols-outlined">${topic.completed ? 'check_circle' : 'radio_button_unchecked'}</span>
                </button>
                <div class="flex-1">
                    <div class="flex justify-between items-start">
                        <input type="text" value="${topic.name}" onchange="updateTopicName('${topic.name}', this.value)"
                            class="bg-transparent border-none text-white font-medium p-0 focus:ring-0 w-full">
                        <button onclick="deleteTopic('${topic.name}')" class="text-slate-500 hover:text-red-400">
                            <span class="material-symbols-outlined text-[18px]">close</span>
                        </button>
                    </div>
                    <div class="flex items-center gap-4 mt-2">
                        <input type="text" value="${topic.duration}" placeholder="Duration" onchange="updateTopicDuration('${topic.name}', this.value)"
                            class="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 w-24">
                        <input type="date" value="${topic.scheduledDate || ''}" onchange="updateTopicDate('${topic.name}', this.value)"
                            class="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300">
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function addModule() {
    const name = prompt('Enter module name:');
    if (!name) return;

    const newModule = {
        id: 'mod-' + Date.now(),
        name,
        order: (currentEditingBatch.modules.length || 0) + 1,
        status: 'not-started',
        topics: []
    };

    if (!currentEditingBatch.modules) currentEditingBatch.modules = [];
    currentEditingBatch.modules.push(newModule);

    renderAdminModules();
    selectModule(newModule.id);
}

function deleteModule(moduleId) {
    if (!confirm('Delete this module and all its topics?')) return;
    currentEditingBatch.modules = currentEditingBatch.modules.filter(m => m.id !== moduleId);

    if (currentEditingModuleId === moduleId) {
        currentEditingModuleId = null;
        document.getElementById('admin-topics-list').innerHTML = '';
        document.getElementById('section-topics-header').classList.add('hidden');
    }

    renderAdminModules();
}

function addTopic() {
    if (!currentEditingModuleId) return;

    const module = currentEditingBatch.modules.find(m => m.id === currentEditingModuleId);
    if (!module) return;

    const name = prompt('Enter topic name:');
    if (!name) return;

    module.topics.push({
        name,
        duration: '2 Hours',
        completed: false
    });

    renderAdminTopics();
}

function deleteTopic(topicName) {
    const module = currentEditingBatch.modules.find(m => m.id === currentEditingModuleId);
    if (!module) return;

    module.topics = module.topics.filter(t => t.name !== topicName);
    renderAdminTopics();
}

function updateTopicName(oldName, newName) {
    const module = currentEditingBatch.modules.find(m => m.id === currentEditingModuleId);
    const topic = module.topics.find(t => t.name === oldName);
    if (topic) topic.name = newName;
}

function updateTopicDuration(topicName, duration) {
    const module = currentEditingBatch.modules.find(m => m.id === currentEditingModuleId);
    const topic = module.topics.find(t => t.name === topicName);
    if (topic) topic.duration = duration;
}

function updateTopicDate(topicName, date) {
    const module = currentEditingBatch.modules.find(m => m.id === currentEditingModuleId);
    const topic = module.topics.find(t => t.name === topicName);
    if (topic) topic.scheduledDate = date;
}

function toggleTopicCompletion(topicName) {
    const module = currentEditingBatch.modules.find(m => m.id === currentEditingModuleId);
    const topic = module.topics.find(t => t.name === topicName);
    if (topic) {
        topic.completed = !topic.completed;
        if (topic.completed) topic.completedDate = new Date().toISOString().split('T')[0];
        else delete topic.completedDate;

        // Update module status?
        const allCompleted = module.topics.every(t => t.completed);
        const someCompleted = module.topics.some(t => t.completed);

        if (allCompleted && module.topics.length > 0) module.status = 'completed';
        else if (someCompleted) module.status = 'in-progress';
        else module.status = 'not-started';

        renderAdminTopics();
        renderAdminModules(); // Update module status display
    }
}

async function saveCurriculumChanges() {
    if (!currentEditingBatch) return;

    // Update local data
    const batchIndex = currentConfig.batchesDetailed.findIndex(b => b.id === currentEditingBatch.id);
    if (batchIndex !== -1) {
        currentConfig.batchesDetailed[batchIndex] = currentEditingBatch;
    }

    // Save to backend
    try {
        await fetch(`${BACKEND_URL}/detailed-batches`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ batchesDetailed: currentConfig.batchesDetailed })
        });
        showToast('Curriculum saved successfully');
        renderDetailedBatchesAdmin(currentConfig.batchesDetailed);
    } catch (error) {
        console.error('Error saving curriculum:', error);
        showToast('Failed to save curriculum changes', 'error');
    }
}

let batchRequests = [];

async function fetchBatchRequests() {
    try {
        const response = await fetch('http://localhost:8080/api/batch-requests');
        const result = await response.json();

        if (result.success) {
            batchRequests = result.data;
            renderBatchRequests(batchRequests);
            // Update stat
            const pendingCount = batchRequests.filter(r => r.status === 'pending').length;
            document.getElementById('stat-requests').textContent = pendingCount;
        }
    } catch (error) {
        console.error('Error fetching batch requests:', error);
        showToast('Failed to load batch requests', 'error');
    }
}

function renderBatchRequests(requests) {
    const container = document.getElementById('requests-container');

    if (!requests || requests.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="7" class="px-4 py-8 text-center text-slate-400">
                    No batch requests yet
                </td>
            </tr>
        `;
        return;
    }

    container.innerHTML = requests.map(req => {
        const statusColors = {
            'pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
            'approved': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
            'rejected': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
        };

        const date = new Date(req.createdAt).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });

        return `
            <tr class="hover:bg-slate-700/30 transition-colors">
                <td class="px-4 py-3">
                    <div class="font-semibold text-white">${req.studentName}</div>
                    <div class="text-xs text-slate-400">${req.email}</div>
                </td>
                <td class="px-4 py-3 text-sm text-slate-300">${req.phone}</td>
                <td class="px-4 py-3 text-sm text-slate-300">${req.courseTrack}</td>
                <td class="px-4 py-3 text-sm text-slate-300">${req.preferredTime}</td>
                <td class="px-4 py-3 text-sm text-slate-300">${req.batchSize}</td>
                <td class="px-4 py-3 text-xs text-slate-400">${date}</td>
                <td class="px-4 py-3">
                    <div class="flex items-center gap-2">
                        <span class="px-2 py-1 rounded text-xs font-medium ${statusColors[req.status] || statusColors.pending}">
                            ${req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                        </span>
                        ${req.status === 'pending' ? `
                            <button onclick="approveRequest('${req.id}')" 
                                class="p-1.5 bg-green-600 hover:bg-green-500 text-white rounded transition-colors" 
                                title="Approve">
                                <span class="material-symbols-outlined text-[16px]">check</span>
                            </button>
                            <button onclick="rejectRequest('${req.id}')" 
                                class="p-1.5 bg-red-600 hover:bg-red-500 text-white rounded transition-colors" 
                                title="Reject">
                                <span class="material-symbols-outlined text-[16px]">close</span>
                            </button>
                        ` : ''}
                        <button onclick="deleteRequest('${req.id}')" 
                            class="p-1.5 bg-slate-600 hover:bg-slate-500 text-white rounded transition-colors" 
                            title="Delete">
                            <span class="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

async function approveRequest(requestId) {
    if (!confirm('Approve this batch request? A confirmation email will be sent to the student.')) {
        return;
    }

    try {
        const response = await fetch(`http://localhost:8080/api/batch-requests/${requestId}/approve`, {
            method: 'PUT'
        });

        const result = await response.json();
        if (result.success) {
            showToast('Request approved! Confirmation email sent to student.');
            fetchBatchRequests();
        } else {
            showToast('Failed to approve request', 'error');
        }
    } catch (error) {
        console.error('Error approving request:', error);
        showToast('Backend server not running', 'error');
    }
}

async function rejectRequest(requestId) {
    const reason = prompt('Enter rejection reason (optional):');
    if (reason === null) return; // User cancelled

    try {
        const response = await fetch(`http://localhost:8080/api/batch-requests/${requestId}/reject`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason: reason || 'Not specified' })
        });

        const result = await response.json();
        if (result.success) {
            showToast('Request rejected. Notification email sent to student.');
            fetchBatchRequests();
        } else {
            showToast('Failed to reject request', 'error');
        }
    } catch (error) {
        console.error('Error rejecting request:', error);
        showToast('Backend server not running', 'error');
    }
}

async function deleteRequest(requestId) {
    if (!confirm('Delete this request permanently?')) {
        return;
    }

    try {
        const response = await fetch(`http://localhost:8080/api/batch-requests/${requestId}`, {
            method: 'DELETE'
        });

        const result = await response.json();
        if (result.success) {
            showToast('Request deleted successfully!');
            fetchBatchRequests();
        } else {
            showToast('Failed to delete request', 'error');
        }
    } catch (error) {
        console.error('Error deleting request:', error);
        showToast('Backend server not running', 'error');
    }
}

function refreshRequests() {
    fetchBatchRequests();
    showToast('Requests refreshed!');
}

// ==================
// ENROLLMENT MANAGEMENT
// ==================

let allEnrollments = [];
let currentFilter = 'Pending';

async function fetchEnrollments() {
    try {
        const response = await fetch('http://127.0.0.1:8080/api/enrollments/online');
        const result = await response.json();

        if (result.success) {
            allEnrollments = result.enrollments || [];
            filterEnrollments();
            // Update pending count in stats
            const pendingCount = allEnrollments.filter(e => e.status === 'Pending').length;
            document.getElementById('stat-requests').textContent = pendingCount;
        } else {
            showToast('Failed to load enrollments', 'error');
        }
    } catch (error) {
        console.error('Error fetching enrollments:', error);
        showToast('Failed to load enrollments', 'error');
    }
}

function filterEnrollments() {
    const filter = document.getElementById('enrollment-filter').value;
    currentFilter = filter;

    let filtered = allEnrollments;
    if (filter !== 'all') {
        filtered = allEnrollments.filter(e => e.status === filter);
    }

    renderEnrollments(filtered);
}

function renderEnrollments(enrollments) {
    const container = document.getElementById('enrollments-container');

    if (!enrollments || enrollments.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="6" class="px-4 py-8 text-center text-slate-400">
                    No ${currentFilter !== 'all' ? currentFilter.toLowerCase() : ''} enrollments found
                </td>
            </tr>
        `;
        return;
    }

    container.innerHTML = enrollments.map(enrollment => {
        const statusColors = {
            'Pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
            'Approved': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
            'Rejected': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
        };

        const date = new Date(enrollment.enrolledAt).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });

        const batchInfo = enrollment.batchDetails || {};
        const courseInfo = `${enrollment.course || enrollment.courseTrack || 'N/A'}`;
        const timeInfo = batchInfo.time || enrollment.preferredTime || 'N/A';

        return `
            <tr class="hover:bg-slate-700/30 transition-colors">
                <td class="px-4 py-3">
                    <div class="font-semibold text-white">${enrollment.studentName}</div>
                    <div class="text-xs text-slate-400">${enrollment.email}</div>
                </td>
                <td class="px-4 py-3">
                    <div class="text-sm text-slate-300">${enrollment.phone || 'N/A'}</div>
                </td>
                <td class="px-4 py-3">
                    <div class="text-sm text-slate-300 font-medium">${courseInfo}</div>
                    <div class="text-xs text-slate-400">${timeInfo}</div>
                    ${enrollment.batchSize ? `<div class="text-xs text-slate-500">${enrollment.batchSize}</div>` : ''}
                </td>
                <td class="px-4 py-3 text-xs text-slate-400">${date}</td>
                <td class="px-4 py-3">
                    <span class="px-2 py-1 rounded text-xs font-medium ${statusColors[enrollment.status] || statusColors.Pending}">
                        ${enrollment.status}
                    </span>
                </td>
                <td class="px-4 py-3">
                    <div class="flex items-center gap-2">
                        ${enrollment.status === 'Pending' ? `
                            <button onclick="approveEnrollment('${enrollment.id}')" 
                                class="p-1.5 bg-green-600 hover:bg-green-500 text-white rounded transition-colors" 
                                title="Approve Enrollment">
                                <span class="material-symbols-outlined text-[16px]">check</span>
                            </button>
                            <button onclick="rejectEnrollment('${enrollment.id}')" 
                                class="p-1.5 bg-red-600 hover:bg-red-500 text-white rounded transition-colors" 
                                title="Reject Enrollment">
                                <span class="material-symbols-outlined text-[16px]">close</span>
                            </button>
                        ` : ''}
                        ${enrollment.additionalNotes ? `
                            <button onclick="alert('Notes: ${enrollment.additionalNotes.replace(/'/g, "\\'")}');" 
                                class="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors" 
                                title="View Notes">
                                <span class="material-symbols-outlined text-[16px]">notes</span>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

async function approveEnrollment(enrollmentId) {
    if (!confirm('Approve this enrollment? The student will be notified.')) {
        return;
    }

    try {
        const adminEmail = localStorage.getItem('adminUser') ? JSON.parse(localStorage.getItem('adminUser')).email : 'Admin';

        const response = await fetch(`http://127.0.0.1:8080/api/enrollments/${enrollmentId}/approve`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reviewedBy: adminEmail })
        });

        const result = await response.json();
        if (result.success) {
            showToast('Enrollment approved successfully!');
            fetchEnrollments();
        } else {
            showToast('Failed to approve enrollment', 'error');
        }
    } catch (error) {
        console.error('Error approving enrollment:', error);
        showToast('Backend server not running', 'error');
    }
}

async function rejectEnrollment(enrollmentId) {
    const reason = prompt('Enter rejection reason (optional):');
    if (reason === null) return; // User cancelled

    try {
        const adminEmail = localStorage.getItem('adminUser') ? JSON.parse(localStorage.getItem('adminUser')).email : 'Admin';

        const response = await fetch(`http://127.0.0.1:8080/api/enrollments/${enrollmentId}/reject`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                reviewedBy: adminEmail,
                reason: reason || 'Not specified'
            })
        });

        const result = await response.json();
        if (result.success) {
            showToast('Enrollment rejected.');
            fetchEnrollments();
        } else {
            showToast('Failed to reject enrollment', 'error');
        }
    } catch (error) {
        console.error('Error rejecting enrollment:', error);
        showToast('Backend server not running', 'error');
    }
}

function refreshEnrollments() {
    fetchEnrollments();
    showToast('Enrollments refreshed!');
}

// ==================
// INITIALIZATION
// ==================

document.addEventListener('DOMContentLoaded', () => {
    fetchConfig();
    fetchBatchRequests();
    fetchEnrollments();
});
