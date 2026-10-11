// ==========================================================================
// CATALOGO CABALLEROS - MÓDULO DE GESTIÓN Y PANEL DEL ADMINISTRADOR
// ==========================================================================

const AdminModule = {
  // Lista en memoria de subcategorías obtenidas del servidor
  allSubcategories: [],

  init() {
    this.bindEvents();
    this.fetchSubcategories();
  },

  bindEvents() {
    // Abrir modal de nuevo producto
    const btnOpenCreate = document.getElementById('btnOpenCreateProductModal');
    if (btnOpenCreate) {
      btnOpenCreate.addEventListener('click', () => this.openCreateModal());
    }

    // Cerrar modal de producto
    const btnCloseModal = document.getElementById('btnCloseProductModal');
    const btnCancelModal = document.getElementById('btnCancelProductModal');
    if (btnCloseModal) btnCloseModal.addEventListener('click', () => this.closeProductModal());
    if (btnCancelModal) btnCancelModal.addEventListener('click', () => this.closeProductModal());

    // Toggle Panel en tiempo real de usuarios
    const btnToggleAdminPanel = document.getElementById('btnToggleAdminPanel');
    const btnCloseAdminPanel = document.getElementById('btnCloseAdminPanel');
    if (btnToggleAdminPanel) {
      btnToggleAdminPanel.addEventListener('click', () => this.toggleAdminPanel());
    }
    if (btnCloseAdminPanel) {
      btnCloseAdminPanel.addEventListener('click', () => this.toggleAdminPanel(false));
    }

    // Cambio dinámico de categoría en el formulario de producto
    const prodCategorySelect = document.getElementById('prodCategorySelect');
    if (prodCategorySelect) {
      prodCategorySelect.addEventListener('change', (e) => {
        this.populateSubcategoriesSelect(Number(e.target.value));
      });
    }

    // Manejo de subida local de archivos de foto (PROHIBIDO CLOUDINARY)
    this.setupLocalFileUpload();

    // Envío del formulario de producto
    const productForm = document.getElementById('productForm');
    if (productForm) {
      productForm.addEventListener('submit', (e) => this.handleProductFormSubmit(e));
    }
  },

  // Cargar subcategorías desde la API
  async fetchSubcategories() {
    try {
      const res = await fetch('/api/categories/subcategories');
      const data = await res.json();
      if (data.success) {
        this.allSubcategories = data.data;
        this.populateSubcategoriesSelect(1); // Por defecto Ropa
      }
    } catch (err) {
      console.error('Error al cargar subcategorías:', err);
    }
  },

  // Poblar select de subcategorías agrupadas estrictamente
  populateSubcategoriesSelect(categoryId, selectedSubcatId = null) {
    const select = document.getElementById('prodSubcategorySelect');
    if (!select) return;

    select.innerHTML = '';
    const filtered = this.allSubcategories.filter(sc => sc.categoria_id === categoryId);

    if (categoryId === 1) {
      // ROPA: Dividida en 'Marcas' y 'Normal'
      const marcasGroup = document.createElement('optgroup');
      marcasGroup.label = 'Marcas';
      const normalGroup = document.createElement('optgroup');
      normalGroup.label = 'Normal';

      filtered.forEach(sc => {
        const opt = document.createElement('option');
        opt.value = sc.id;
        opt.textContent = sc.name;
        if (selectedSubcatId && Number(selectedSubcatId) === sc.id) {
          opt.selected = true;
        }

        if (sc.tipo_grupo === 'Marcas') {
          marcasGroup.appendChild(opt);
        } else {
          normalGroup.appendChild(opt);
        }
      });

      select.appendChild(marcasGroup);
      select.appendChild(normalGroup);
    } else {
      // CALZADO: Zapatillas, Zapatos, Sandalias
      const calzadoGroup = document.createElement('optgroup');
      calzadoGroup.label = 'Calzado';

      filtered.forEach(sc => {
        const opt = document.createElement('option');
        opt.value = sc.id;
        opt.textContent = sc.name;
        if (selectedSubcatId && Number(selectedSubcatId) === sc.id) {
          opt.selected = true;
        }
        calzadoGroup.appendChild(opt);
      });

      select.appendChild(calzadoGroup);
    }
  },

  // Configuración de subida local con arrastrar y soltar
  setupLocalFileUpload() {
    const fileZone = document.getElementById('fileUploadZone');
    const fileInput = document.getElementById('prodFileInput');
    const placeholder = document.getElementById('uploadPlaceholder');
    const previewContainer = document.getElementById('imagePreviewContainer');
    const previewImg = document.getElementById('imagePreviewElement');
    const btnRemove = document.getElementById('btnRemovePreview');

    if (!fileZone || !fileInput) return;

    fileZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      fileZone.style.borderColor = 'var(--fucsia-primary)';
      fileZone.style.background = 'var(--fucsia-light)';
    });

    fileZone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      fileZone.style.borderColor = 'var(--celeste-border)';
      fileZone.style.background = 'var(--celeste-light)';
    });

    fileZone.addEventListener('drop', (e) => {
      e.preventDefault();
      fileZone.style.borderColor = 'var(--celeste-border)';
      fileZone.style.background = 'var(--celeste-light)';
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        fileInput.files = e.dataTransfer.files;
        this.displayLocalImagePreview(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files[0]) {
        this.displayLocalImagePreview(fileInput.files[0]);
      }
    });

    if (btnRemove) {
      btnRemove.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.value = '';
        placeholder.classList.remove('hidden');
        previewContainer.classList.add('hidden');
        previewImg.src = '';
      });
    }
  },

  displayLocalImagePreview(file) {
    const placeholder = document.getElementById('uploadPlaceholder');
    const previewContainer = document.getElementById('imagePreviewContainer');
    const previewImg = document.getElementById('imagePreviewElement');

    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      placeholder.classList.add('hidden');
      previewContainer.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  },

  openCreateModal() {
    const modal = document.getElementById('productModalOverlay');
    const form = document.getElementById('productForm');
    const title = document.getElementById('productModalTitle');
    const submitBtn = document.getElementById('saveProductBtnText');
    const editId = document.getElementById('editProductId');

    form.reset();
    editId.value = '';
    title.textContent = 'Agregar Nuevo Producto';
    submitBtn.textContent = 'Guardar y Sincronizar';

    // Restablecer preview de imagen
    const placeholder = document.getElementById('uploadPlaceholder');
    const previewContainer = document.getElementById('imagePreviewContainer');
    if (placeholder) placeholder.classList.remove('hidden');
    if (previewContainer) previewContainer.classList.add('hidden');

    this.populateSubcategoriesSelect(1);
    modal.classList.remove('hidden');
  },

  openEditModal(product) {
    const modal = document.getElementById('productModalOverlay');
    const title = document.getElementById('productModalTitle');
    const submitBtn = document.getElementById('saveProductBtnText');
    const editId = document.getElementById('editProductId');

    editId.value = product.id;
    title.textContent = `Editar Producto #${product.id}`;
    submitBtn.textContent = 'Actualizar y Sincronizar';

    document.getElementById('prodTitleInput').value = product.title || '';
    document.getElementById('prodCategorySelect').value = product.categoria_id;
    this.populateSubcategoriesSelect(product.categoria_id, product.subcategoria_id);
    document.getElementById('prodPriceInput').value = product.price || '';
    document.getElementById('prodOriginalPriceInput').value = product.original_price || '';
    document.getElementById('prodSizesInput').value = product.sizes || '';
    document.getElementById('prodStockInput').value = product.stock !== undefined ? product.stock : 10;
    document.getElementById('prodBadgeSelect').value = product.badge || '';
    document.getElementById('prodDescInput').value = product.description || '';

    // Mostrar foto actual en preview
    const placeholder = document.getElementById('uploadPlaceholder');
    const previewContainer = document.getElementById('imagePreviewContainer');
    const previewImg = document.getElementById('imagePreviewElement');
    if (product.image_url) {
      previewImg.src = product.image_url;
      placeholder.classList.add('hidden');
      previewContainer.classList.remove('hidden');
    }

    modal.classList.remove('hidden');
  },

  closeProductModal() {
    const modal = document.getElementById('productModalOverlay');
    if (modal) modal.classList.add('hidden');
  },

  // Procesar guardado (Crear o Actualizar) con almacenamiento local
  async handleProductFormSubmit(e) {
    e.preventDefault();

    const currentUser = window.AppState ? window.AppState.currentUser : null;
    if (!currentUser || currentUser.role !== 'admin') {
      alert('Solo el Administrador puede gestionar productos.');
      return;
    }

    const editId = document.getElementById('editProductId').value;
    const isEdit = Boolean(editId);

    const formData = new FormData();
    formData.append('title', document.getElementById('prodTitleInput').value.trim());
    formData.append('categoria_id', document.getElementById('prodCategorySelect').value);
    formData.append('subcategoria_id', document.getElementById('prodSubcategorySelect').value);
    formData.append('price', document.getElementById('prodPriceInput').value);
    formData.append('original_price', document.getElementById('prodOriginalPriceInput').value);
    formData.append('sizes', document.getElementById('prodSizesInput').value.trim());
    formData.append('stock', document.getElementById('prodStockInput').value);
    formData.append('badge', document.getElementById('prodBadgeSelect').value);
    formData.append('description', document.getElementById('prodDescInput').value.trim());

    // Archivo de imagen local
    const fileInput = document.getElementById('prodFileInput');
    if (fileInput.files && fileInput.files[0]) {
      formData.append('image', fileInput.files[0]);
    }

    const submitBtn = document.getElementById('saveProductBtnText');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Guardando en disco local...';

    try {
      const url = isEdit ? `/api/products/${editId}` : '/api/products';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${currentUser.token}`
        },
        body: formData
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Error al guardar el producto.');
      }

      this.closeProductModal();
      window.showToast(isEdit ? '✅ Producto actualizado correctamente' : '🎉 Producto creado y sincronizado en tiempo real');

    } catch (err) {
      console.error('Error al guardar producto:', err);
      alert(err.message || 'Error en la petición.');
    } finally {
      submitBtn.textContent = originalText;
    }
  },

  // Confirmar y eliminar producto
  async deleteProduct(productId, productTitle) {
    const currentUser = window.AppState ? window.AppState.currentUser : null;
    if (!currentUser || currentUser.role !== 'admin') {
      alert('Acceso no autorizado.');
      return;
    }

    const confirmDelete = confirm(`¿Estás seguro de eliminar el producto "${productTitle}"?\nEsta acción actualizará las pantallas de todos los usuarios de inmediato.`);
    if (!confirmDelete) return;

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${currentUser.token}`
        }
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'No se pudo eliminar el producto.');
      }

      window.showToast('🗑️ Producto eliminado exitosamente.');
    } catch (err) {
      console.error('Error al eliminar producto:', err);
      alert(err.message || 'Error al eliminar producto.');
    }
  },

  // Toggle de visibilidad del Panel en Tiempo Real
  toggleAdminPanel(forceState = null) {
    const panelWrapper = document.getElementById('adminLivePanelWrapper');
    if (!panelWrapper) return;

    if (forceState !== null) {
      if (forceState) panelWrapper.classList.remove('hidden');
      else panelWrapper.classList.add('hidden');
    } else {
      panelWrapper.classList.toggle('hidden');
    }
  },

  // Renderizar la lista de usuarios conectados en vivo
  renderLiveUsers(data) {
    const users = (data && data.users) ? data.users : [];
    const count = (data && typeof data.count === 'number') ? data.count : users.length;

    // Actualizar badges de conteo
    const liveCountBadge = document.getElementById('adminLiveCountBadge');
    const panelUserCount = document.getElementById('adminPanelUserCount');
    const activeUsersChip = document.getElementById('activeUsersCount');

    if (liveCountBadge) liveCountBadge.textContent = count;
    if (panelUserCount) panelUserCount.textContent = count;
    if (activeUsersChip) activeUsersChip.textContent = count;

    // Actualizar contenedor
    const container = document.getElementById('liveUsersList');
    if (!container) return;

    if (users.length === 0) {
      container.innerHTML = '<div class="empty-state-small">No hay otros usuarios conectados actualmente.</div>';
      return;
    }

    container.innerHTML = users.map(u => {
      const isAdmin = u.role === 'admin';
      const initial = (u.username || 'U').charAt(0).toUpperCase();
      const connectedTime = u.connected_at ? new Date(u.connected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Ahora';

      return `
        <div class="user-card-live" id="user-socket-${u.socket_id}">
          <div class="user-card-info">
            <div class="user-avatar-badge ${isAdmin ? 'avatar-admin' : 'avatar-cliente'}">
              ${initial}
            </div>
            <div class="user-details">
              <h4>${u.username}</h4>
              <span>Rol: <strong>${isAdmin ? '👑 Administrador' : '👤 Cliente'}</strong></span>
            </div>
          </div>
          <div class="user-card-meta">
            <span class="badge-status-online">Online</span>
            <span style="font-size: 0.72rem; color: #94a3b8;">${connectedTime}</span>
          </div>
        </div>
      `;
    }).join('');
  },

  // Actualizar la interfaz según el rol del usuario (Admin vs Cliente)
  updateAdminUIState(isAdmin) {
    const adminElements = document.querySelectorAll('.btn-admin-only');
    adminElements.forEach(el => {
      if (isAdmin) el.classList.remove('hidden');
      else el.classList.add('hidden');
    });

    const adminPanelWrapper = document.getElementById('adminLivePanelWrapper');
    if (!isAdmin && adminPanelWrapper) {
      adminPanelWrapper.classList.add('hidden');
    }
  }
};

window.AdminModule = AdminModule;
