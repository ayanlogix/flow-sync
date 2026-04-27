document.addEventListener('DOMContentLoaded', () => {
    const linkCanvas = document.getElementById('linkCanvas');
    const ctx = linkCanvas.getContext('2d');
    const nodesContainer = document.getElementById('nodesContainer');
    const executionLog = document.getElementById('executionLog');
    const sidebarItems = document.querySelectorAll('.connector-item');

    // 1. Studio State
    let nodes = [];
    let connections = [];
    let pulses = [];
    let isDragging = false;
    let dragNode = null;
    let offset = { x: 0, y: 0 };

    const nodeTypes = {
        stripe: { 
            name: "Stripe Event", 
            icon: `<img src="https://cdn.simpleicons.org/stripe/635bff" alt="Stripe">`, 
            color: "#635bff", desc: "Listen for new webhooks" 
        },
        shopify: { 
            name: "Shopify Order", 
            icon: `<img src="https://cdn.simpleicons.org/shopify/95bf47" alt="Shopify">`, 
            color: "#95bf47", desc: "Trigger on successful sale" 
        },
        discord: { 
            name: "Discord Bot", 
            icon: `<img src="https://cdn.simpleicons.org/discord/5865f2" alt="Discord">`, 
            color: "#5865f2", desc: "Post to channel #general" 
        },
        gmail: { 
            name: "Gmail API", 
            icon: `<img src="https://cdn.simpleicons.org/gmail/ea4335" alt="Gmail">`, 
            color: "#ea4335", desc: "Send summary email" 
        },
        slack: { 
            name: "Slack Connect", 
            icon: `<svg viewBox="0 0 24 24" style="width:100%;height:100%;fill:#4a154b"><path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523 2.528 2.528 0 0 1-2.522-2.523 2.528 2.528 0 0 1 2.522-2.52h2.52v2.52zm1.261 0a2.528 2.528 0 0 1 2.52-2.52h2.52v7.556a2.528 2.528 0 0 1-2.52 2.522 2.528 2.528 0 0 1-2.52-2.522v-5.036zM8.835 5.042a2.528 2.528 0 0 1-2.523-2.52 2.528 2.528 0 0 1 2.523-2.522 2.528 2.528 0 0 1 2.52 2.522v2.52h-2.52zm0 1.261a2.528 2.528 0 0 1 2.52 2.52v2.52H3.8a2.528 2.528 0 0 1-2.522-2.52 2.528 2.528 0 0 1 2.522-2.52h5.035zM18.958 8.835a2.528 2.528 0 0 1 2.522-2.523 2.528 2.528 0 0 1 2.52 2.523 2.528 2.528 0 0 1-2.52 2.522h-2.522v-2.522zm-1.261 0a2.528 2.528 0 0 1-2.52 2.522h-2.522V3.8a2.528 2.528 0 0 1 2.522-2.522 2.528 2.528 0 0 1 2.52 2.522v5.035zM15.165 18.958a2.528 2.528 0 0 1 2.523 2.522 2.528 2.528 0 0 1-2.523 2.52 2.528 2.528 0 0 1-2.52-2.52v-2.522h2.52zm0-1.261a2.528 2.528 0 0 1-2.52-2.522v-2.522h7.556a2.528 2.528 0 0 1 2.522 2.52 2.528 2.528 0 0 1-2.522 2.522h-5.036z"/></svg>`, 
            color: "#4a154b", desc: "Ping engineering team" 
        }
    };

    // 2. Node Engine
    const createNode = (type, x, y) => {
        const id = 'node_' + Math.random().toString(36).substr(2, 9);
        const config = nodeTypes[type];
        
        const nodeEl = document.createElement('div');
        nodeEl.className = 'node';
        nodeEl.id = id;
        nodeEl.style.left = `${x}px`;
        nodeEl.style.top = `${y}px`;
        
        nodeEl.innerHTML = `
            <div class="node-header">
                <div class="icon ${type}">${config.icon}</div>
                <span>${config.name}</span>
            </div>
            <div class="node-body">${config.desc}</div>
            <div class="node-ports">
                <div class="port input" data-id="${id}" data-type="input"></div>
                <div class="port output" data-id="${id}" data-type="output"></div>
            </div>
        `;

        nodesContainer.appendChild(nodeEl);
        const node = { id, type, x, y, el: nodeEl, config };
        nodes.push(node);

        // Drag Logic
        nodeEl.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('port')) return;
            isDragging = true;
            dragNode = node;
            const rect = nodeEl.getBoundingClientRect();
            offset.x = e.clientX - rect.left;
            offset.y = e.clientY - rect.top;
            nodes.forEach(n => n.el.classList.remove('active'));
            nodeEl.classList.add('active');
        });

        // Add to Link Logic
        if (nodes.length > 1) {
            const prev = nodes[nodes.length - 2];
            connections.push({ from: prev.id, to: id });
        }

        return node;
    };

    // 3. Linker Engine (Canvas)
    const drawBezier = (x1, y1, x2, y2, active = false) => {
        ctx.beginPath();
        const cp1x = x1 + (x2 - x1) / 2;
        const cp2x = x1 + (x2 - x1) / 2;
        ctx.moveTo(x1, y1);
        ctx.bezierCurveTo(cp1x, y1, cp2x, y2, x2, y2);
        
        ctx.strokeStyle = active ? '#8b5cf6' : 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = active ? 3 : 2;
        ctx.stroke();

        // Arrow head
        if(active) {
            ctx.fillStyle = '#8b5cf6';
            ctx.beginPath();
            ctx.arc(x2, y2, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    };

    const resizeCanvas = () => {
        const wrapper = document.getElementById('nodeCanvasWrapper');
        if (wrapper) {
            linkCanvas.width = wrapper.clientWidth;
            linkCanvas.height = wrapper.clientHeight;
        }
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const render = () => {
        ctx.clearRect(0, 0, linkCanvas.width, linkCanvas.height);

        connections.forEach(conn => {
            const nodeFrom = nodes.find(n => n.id === conn.from);
            const nodeTo = nodes.find(n => n.id === conn.to);
            if (nodeFrom && nodeTo) {
                const x1 = nodeFrom.x + 200;
                const y1 = nodeFrom.y + 45; // Approx center of output port
                const x2 = nodeTo.x;
                const y2 = nodeTo.y + 45; // Approx center of input port
                drawBezier(x1, y1, x2, y2, activeSync);
            }
        });

        pulses = pulses.filter(p => {
            const alive = p.update();
            if (alive) p.draw(ctx);
            return alive;
        });

        requestAnimationFrame(render);
    };

    // 4. Interaction Handlers
    document.addEventListener('mousemove', (e) => {
        if (isDragging && dragNode) {
            const x = e.clientX - offset.x - nodesContainer.getBoundingClientRect().left;
            const y = e.clientY - offset.y - nodesContainer.getBoundingClientRect().top;
            dragNode.x = x;
            dragNode.y = y;
            dragNode.el.style.left = `${x}px`;
            dragNode.el.style.top = `${y}px`;
        }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        dragNode = null;
    });

    // Sidebar Click Spawning
    sidebarItems.forEach(item => {
        item.addEventListener('click', () => {
            const type = item.getAttribute('data-node-type');
            if (nodeTypes[type]) {
                createNode(type, 150 + Math.random() * 100, 150 + Math.random() * 100);
                addLog(`Orchestrator: Initialized ${type.toUpperCase()} node`, 'system');
            }
        });
    });

    // 5. Sync Simulation
    let activeSync = false;
    class SyncPulse {
        constructor(x1, y1, x2, y2) {
            this.x1 = x1; this.y1 = y1; this.x2 = x2; this.y2 = y2;
            this.progress = 0;
            this.cp1x = x1 + (x2 - x1) / 2;
            this.cp2x = x1 + (x2 - x1) / 2;
        }
        update() {
            this.progress += 0.015;
            return this.progress < 1;
        }
        draw(ctx) {
            const t = this.progress;
            const cx = (1 - t) ** 3 * this.x1 + 3 * (1 - t) ** 2 * t * this.cp1x + 3 * (1 - t) * t ** 2 * this.cp2x + t ** 3 * this.x2;
            const cy = (1 - t) ** 3 * this.y1 + 3 * (1 - t) ** 2 * t * this.y1 + 3 * (1 - t) * t ** 2 * this.y2 + t ** 3 * this.y2;
            
            ctx.beginPath();
            ctx.arc(cx, cy, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#8b5cf6';
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#8b5cf6';
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }

    const addLog = (msg, type = 'sync') => {
        const item = document.createElement('div');
        item.className = `log-item ${type}`;
        item.innerText = ` > [${new Date().toLocaleTimeString('en-GB')}] ${msg}`;
        executionLog.prepend(item);
        if (executionLog.children.length > 5) executionLog.lastChild.remove();
    };

    const triggerSync = () => {
        if (nodes.length < 2) return;
        activeSync = true;
        addLog('TRIGGER: New event detected in Stripe', 'system');
        
        connections.forEach(conn => {
            const nodeFrom = nodes.find(n => n.id === conn.from);
            const nodeTo = nodes.find(n => n.id === conn.to);
            if(nodeFrom && nodeTo) {
                pulses.push(new SyncPulse(nodeFrom.x + 200, nodeFrom.y + 45, nodeTo.x, nodeTo.y + 45));
                setTimeout(() => {
                    addLog(`SYNC: Handshake verified with ${nodeTo.config.name}`, 'sync');
                }, 800);
            }
        });

        setTimeout(() => activeSync = false, 2000);
    };

    // 6. Deploy & Zoom Engine
    const deployBtn = document.querySelector('.deploy-btn');
    const zoomIn = document.querySelectorAll('.zoom-controls button')[0];
    const zoomOut = document.querySelectorAll('.zoom-controls button')[1];
    const zoomText = document.querySelector('.zoom-controls span');
    
    let currentZoom = 1;

    deployBtn.addEventListener('click', () => {
        if (nodes.length < 2) {
            addLog('DEPLOY_ERROR: At least 2 nodes required for sync', 'system');
            return;
        }
        deployBtn.innerText = 'Deploying...';
        deployBtn.style.opacity = '0.7';
        
        setTimeout(() => {
            triggerSync();
            addLog('DEPLOY_SUCCESS: Automation live on 8 production nodes', 'sync');
            deployBtn.innerText = 'Deploy Automation';
            deployBtn.style.opacity = '1';
            
            // Visual feedback
            nodesContainer.style.boxShadow = '0 0 50px var(--accent-glow)';
            setTimeout(() => nodesContainer.style.boxShadow = 'none', 1000);
        }, 1200);
    });

    const updateZoom = (delta) => {
        currentZoom = Math.min(Math.max(0.5, currentZoom + delta), 1.5);
        nodesContainer.style.transform = `scale(${currentZoom})`;
        linkCanvas.style.transform = `scale(${currentZoom})`;
        zoomText.innerText = `${Math.round(currentZoom * 100)}%`;
    };

    zoomIn.addEventListener('click', () => updateZoom(0.1));
    zoomOut.addEventListener('click', () => updateZoom(-0.1));

    // Initial Layout
    createNode('stripe', 100, 150);
    createNode('discord', 400, 150);
    
    requestAnimationFrame(render);
});
