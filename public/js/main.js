// Common UI functions

function renderSidebar(role) {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    const user = getSavedUser();
    let links = '';

    if (role === 'admin') {
        links = `
            <a href="/admin/dashboard.html" class="flex items-center space-x-3 text-gray-700 p-3 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors">
                <i class="fas fa-home w-5 text-center"></i>
                <span class="font-medium">Dashboard</span>
            </a>
            <a href="/admin/employees.html" class="flex items-center space-x-3 text-gray-700 p-3 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors">
                <i class="fas fa-users w-5 text-center"></i>
                <span class="font-medium">Employees</span>
            </a>
            <a href="/admin/attendance.html" class="flex items-center space-x-3 text-gray-700 p-3 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors">
                <i class="fas fa-clock w-5 text-center"></i>
                <span class="font-medium">Attendance</span>
            </a>
            <a href="/admin/leaves.html" class="flex items-center space-x-3 text-gray-700 p-3 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors">
                <i class="fas fa-calendar-times w-5 text-center"></i>
                <span class="font-medium">Leaves</span>
            </a>
            <a href="/admin/reports.html" class="flex items-center space-x-3 text-gray-700 p-3 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors">
                <i class="fas fa-file-alt w-5 text-center"></i>
                <span class="font-medium">Work Reports</span>
            </a>
        `;
    } else {
        links = `
            <a href="/employee/dashboard.html" class="flex items-center space-x-3 text-gray-700 p-3 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors">
                <i class="fas fa-home w-5 text-center"></i>
                <span class="font-medium">Dashboard</span>
            </a>
            <a href="/employee/attendance.html" class="flex items-center space-x-3 text-gray-700 p-3 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors">
                <i class="fas fa-fingerprint w-5 text-center"></i>
                <span class="font-medium">Punch In/Out</span>
            </a>
            <a href="/employee/leave.html" class="flex items-center space-x-3 text-gray-700 p-3 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors">
                <i class="fas fa-calendar-plus w-5 text-center"></i>
                <span class="font-medium">Leave Request</span>
            </a>
            <a href="/employee/report.html" class="flex items-center space-x-3 text-gray-700 p-3 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors">
                <i class="fas fa-clipboard-list w-5 text-center"></i>
                <span class="font-medium">Daily Report</span>
            </a>
            <a href="/employee/profile.html" class="flex items-center space-x-3 text-gray-700 p-3 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors">
                <i class="fas fa-user w-5 text-center"></i>
                <span class="font-medium">Profile</span>
            </a>
        `;
    }

    sidebar.innerHTML = `
        <div class="p-6">
            <div class="flex items-center space-x-3 mb-8">
                <div class="bg-blue-600 text-white p-2 rounded-lg">
                    <i class="fas fa-building text-xl"></i>
                </div>
                <h2 class="text-2xl font-bold font-serif text-gray-800">HRMS</h2>
            </div>
            
            <div class="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p class="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1">Signed in as</p>
                <p class="font-medium text-gray-800 truncate">${user ? user.name : 'Unknown'}</p>
                <p class="text-sm text-gray-500 capitalize">${user ? user.role : ''}</p>
            </div>

            <nav class="space-y-1">
                ${links}
            </nav>
        </div>
        
        <div class="p-6 border-t border-gray-200">
            <button onclick="logout()" class="flex items-center space-x-3 text-red-600 w-full p-3 rounded-lg hover:bg-red-50 transition-colors">
                <i class="fas fa-sign-out-alt w-5 text-center"></i>
                <span class="font-medium">Log out</span>
            </button>
        </div>
    `;

    // Highlight active link
    const currentPath = window.location.pathname;
    const navLinks = sidebar.querySelectorAll('a');
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('bg-blue-50', 'text-blue-600');
            link.classList.remove('text-gray-700');
        }
    });
}

function renderHeader(title) {
    const header = document.getElementById('header');
    if (!header) return;

    // Add mobile toggle menu button
    header.innerHTML = `
        <div class="flex items-center justify-between w-full">
            <div class="flex items-center lg:hidden">
                <button id="mobileMenuBtn" class="text-gray-600 hover:text-gray-900 focus:outline-none p-2 mr-2">
                    <i class="fas fa-bars text-xl"></i>
                </button>
                <h1 class="text-xl font-bold text-gray-800">${title}</h1>
            </div>
            <h1 class="hidden lg:block text-2xl font-bold text-gray-800">${title}</h1>
            
            <div class="flex items-center space-x-4">
                <button class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-bell text-lg"></i>
                </button>
            </div>
        </div>
    `;

    // Setup mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('sidebar');

    if (mobileMenuBtn && sidebar) {
        mobileMenuBtn.addEventListener('click', () => {
            if (sidebar.classList.contains('-translate-x-full')) {
                sidebar.classList.remove('-translate-x-full');
            } else {
                sidebar.classList.add('-translate-x-full');
            }
        });

        // Add an overlay for mobile
        const overlay = document.createElement('div');
        overlay.id = 'sidebarOverlay';
        overlay.className = 'fixed inset-0 bg-gray-900 bg-opacity-50 z-10 lg:hidden hidden';
        document.body.appendChild(overlay);

        mobileMenuBtn.addEventListener('click', () => {
            overlay.classList.toggle('hidden');
        });

        overlay.addEventListener('click', () => {
            sidebar.classList.add('-translate-x-full');
            overlay.classList.add('hidden');
        });
    }
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3 transform transition-all duration-300 translate-y-20 opacity-0 z-50`;

    if (type === 'success') {
        toast.classList.add('bg-green-600');
        toast.innerHTML = `<i class="fas fa-check-circle"></i> <span>${message}</span>`;
    } else {
        toast.classList.add('bg-red-600');
        toast.innerHTML = `<i class="fas fa-exclamation-circle"></i> <span>${message}</span>`;
    }

    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
        toast.classList.remove('translate-y-20', 'opacity-0');
    }, 10);

    // Remove after 3s
    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Download utility for Excel blob
function downloadBlob(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}
