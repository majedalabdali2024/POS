// Fetch categories for dropdown
async function fetchCategories() {
    const response = await fetch('http://84.46.240.24:8000/api/categories_list/');
    const categories = await response.json();
    const categorySelect = document.getElementById('item-cat');
    categories.forEach((cat) => {
      const option = document.createElement('option');
      option.value = cat.id;
      option.textContent = cat.cat_name;
      categorySelect.appendChild(option);
    });
  }
  
  // Fetch units for dropdown
  async function fetchUnits() {
    const response = await fetch('http://84.46.240.24:8000/api/units_list/');
    const units = await response.json();
    const unitSelect = document.getElementById('item-unit');
    units.forEach((unit) => {
      const option = document.createElement('option');
      option.value = unit.id;
      option.textContent = unit.unit_name;
      unitSelect.appendChild(option);
    });
  }
