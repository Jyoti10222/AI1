// ========================
// ASSIGNMENTS CONFIG ROUTES
// ========================
// Add this code to server.js before the "// Start server" line

const assignmentsConfigPath = path.join(__dirname, 'config-assignments.json');

// Helper: Read assignments config
function readAssignmentsConfig() {
    try {
        if (!fs.existsSync(assignmentsConfigPath)) {
            const defaultConfig = { assignments: {} };
            fs.writeFileSync(assignmentsConfigPath, JSON.stringify(defaultConfig, null, 2));
            return defaultConfig;
        }
        const data = fs.readFileSync(assignmentsConfigPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading assignments config:', error);
        return { assignments: {} };
    }
}

// Helper: Write assignments config
function writeAssignmentsConfig(config) {
    try {
        fs.writeFileSync(assignmentsConfigPath, JSON.stringify(config, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing assignments config:', error);
        return false;
    }
}

// GET - Retrieve all assignments configuration
app.get('/api/assignments-config', (req, res) => {
    try {
        const config = readAssignmentsConfig();
        res.json({ success: true, data: config.assignments });
    } catch (error) {
        console.error('Error retrieving assignments:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve assignments' });
    }
});

// GET - Retrieve specific assignment by ID
app.get('/api/assignments-config/:assignmentId', (req, res) => {
    try {
        const { assignmentId } = req.params;
        const config = readAssignmentsConfig();

        if (!config.assignments[assignmentId]) {
            return res.status(404).json({ success: false, message: `Assignment '${assignmentId}' not found` });
        }

        res.json({ success: true, data: config.assignments[assignmentId] });
    } catch (error) {
        console.error('Error retrieving assignment:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve assignment' });
    }
});

// PUT - Update entire assignment configuration
app.put('/api/assignments-config/:assignmentId', (req, res) => {
    try {
        const { assignmentId } = req.params;
        const config = readAssignmentsConfig();

        if (!config.assignments[assignmentId]) {
            return res.status(404).json({ success: false, message: `Assignment '${assignmentId}' not found` });
        }

        // Update the assignment with new data, preserving the ID
        config.assignments[assignmentId] = {
            ...req.body,
            id: assignmentId
        };

        if (writeAssignmentsConfig(config)) {
            res.json({
                success: true,
                message: `Assignment '${assignmentId}' updated successfully`,
                data: config.assignments[assignmentId]
            });
        } else {
            res.status(500).json({ success: false, message: 'Failed to save assignment' });
        }
    } catch (error) {
        console.error('Error updating assignment:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
