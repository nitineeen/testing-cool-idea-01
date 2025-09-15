// builder.js
// Basic state
let pages = [];
let currentPageIndex = -1;
let currentFieldIndex = -1;

// UI references
const pagesList = document.getElementById("pagesList");
const pageControls = document.getElementById("pageControls");
const previewTitle = document.getElementById("previewTitle");
const previewArea = document.getElementById("previewArea");
const pageCounter = document.getElementById("pageCounter");
const progFill = document.getElementById("progFill");
const exportArea = document.getElementById("exportArea");

// Field editor refs
const fieldEditor = document.getElementById("fieldEditor");
const fieldEditorEmpty = document.getElementById("fieldEditorEmpty");
const fieldLabel = document.getElementById("fieldLabel");
const fieldType = document.getElementById("fieldType");
const fieldPlaceholder = document.getElementById("fieldPlaceholder");
const fieldOptions = document.getElementById("fieldOptions");
const fieldRequired = document.getElementById("fieldRequired");
const placeholderRow = document.getElementById("placeholderRow");
const selectOptionsRow = document.getElementById("selectOptionsRow");

// Buttons
document.getElementById("addPageBtn").onclick = () => {
  pages.push({ title: "Page " + (pages.length + 1), fields: [] });
  currentPageIndex = pages.length - 1;
  renderPages();
  renderPageControls();
  renderPreview();
};

document.getElementById("formTitle").oninput = () => {
  previewTitle.textContent = document.getElementById("formTitle").value;
};

document.getElementById("exportBtn").onclick = () => {
  exportArea.value = generateExportHTML();
};

document.getElementById("copyExport").onclick = () => {
  exportArea.select();
  document.execCommand("copy");
  alert("Copied to clipboard!");
};

document.getElementById("downloadExport").onclick = () => {
  const blob = new Blob([generateExportHTML()], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "custom-form.html";
  a.click();
  URL.revokeObjectURL(url);
};

// Field editor events
fieldType.onchange = () => updateFieldEditorUI();

document.getElementById("saveFieldBtn").onclick = () => {
  if (currentPageIndex < 0 || currentFieldIndex < 0) return;
  const f = pages[currentPageIndex].fields[currentFieldIndex];
  f.label = fieldLabel.value;
  f.type = fieldType.value;
  f.placeholder = fieldPlaceholder.value;
  f.options = fieldOptions.value.split("\n").map(o => o.trim()).filter(o => o);
  f.required = fieldRequired.checked;
  renderPreview();
  renderPageControls();
};

document.getElementById("removeFieldBtn").onclick = () => {
  if (currentPageIndex < 0 || currentFieldIndex < 0) return;
  pages[currentPageIndex].fields.splice(currentFieldIndex, 1);
  currentFieldIndex = -1;
  renderPageControls();
  renderPreview();
  hideFieldEditor();
};

// Preview navigation
let previewPageIndex = 0;
document.getElementById("prevPreview").onclick = () => {
  if (previewPageIndex > 0) {
    previewPageIndex--;
    renderPreview();
  }
};
document.getElementById("nextPreview").onclick = () => {
  if (previewPageIndex < pages.length - 1) {
    previewPageIndex++;
    renderPreview();
  } else {
    alert("Form submitted! (Preview)");
  }
};

// ---- Rendering ----

function renderPages() {
  pagesList.innerHTML = "";
  pages.forEach((p, i) => {
    const btn = document.createElement("button");
    btn.className = "w-full text-left px-3 py-2 rounded-xl border border-gray-200";
    btn.textContent = p.title;
    btn.onclick = () => {
      currentPageIndex = i;
      currentFieldIndex = -1;
      renderPageControls();
    };
    pagesList.appendChild(btn);
  });
}

function renderPageControls() {
  if (currentPageIndex < 0) {
    pageControls.innerHTML = "<p class='small'>Select a page to edit.</p>";
    hideFieldEditor();
    return;
  }
  const page = pages[currentPageIndex];
  let html = `<label class='block text-sm font-medium mb-1'>Page Title</label>
  <input id='pageTitleInput' class='w-full px-3 py-2 rounded-xl border border-gray-200 mb-3' value="${page.title}"/>
  <button id='addFieldBtn' class='px-3 py-2 rounded-2xl bg-black text-white text-sm mb-3'>+ Add Field</button>
  <div class='space-y-2'>`;

  page.fields.forEach((f, idx) => {
    html += `<div class='field-card cursor-pointer' data-idx='${idx}'>
      <div class='font-medium text-sm'>${f.label || "(no label)"} — ${f.type}</div>
    </div>`;
  });
  html += "</div>";

  pageControls.innerHTML = html;

  document.getElementById("pageTitleInput").oninput = e => {
    page.title = e.target.value;
    renderPages();
  };
  document.getElementById("addFieldBtn").onclick = () => {
    page.fields.push({
      label: "New Field",
      type: "text",
      placeholder: "",
      options: [],
      required: false
    });
    currentFieldIndex = page.fields.length - 1;
    renderPageControls();
    showFieldEditor(page.fields[currentFieldIndex]);
  };
  pageControls.querySelectorAll(".field-card").forEach(el => {
    el.onclick = () => {
      currentFieldIndex = parseInt(el.dataset.idx, 10);
      showFieldEditor(page.fields[currentFieldIndex]);
    };
  });
}

function showFieldEditor(field) {
  fieldEditor.classList.remove("hidden");
  fieldEditorEmpty.classList.add("hidden");
  fieldLabel.value = field.label;
  fieldType.value = field.type;
  fieldPlaceholder.value = field.placeholder;
  fieldOptions.value = field.options.join("\n");
  fieldRequired.checked = field.required;
  updateFieldEditorUI();
}

function hideFieldEditor() {
  fieldEditor.classList.add("hidden");
  fieldEditorEmpty.classList.remove("hidden");
}

function updateFieldEditorUI() {
  if (fieldType.value === "select") {
    selectOptionsRow.classList.remove("hidden");
    placeholderRow.classList.add("hidden");
  } else if (fieldType.value === "checkbox") {
    selectOptionsRow.classList.add("hidden");
    placeholderRow.classList.add("hidden");
  } else {
    selectOptionsRow.classList.add("hidden");
    placeholderRow.classList.remove("hidden");
  }
}

function renderPreview() {
  // progress
  pageCounter.textContent = `Page ${previewPageIndex + 1} / ${pages.length || 1}`;
  progFill.style.width = `${((previewPageIndex + 1) / (pages.length || 1)) * 100}%`;

  if (pages.length === 0) {
    previewArea.innerHTML = "<p class='small'>No pages yet.</p>";
    return;
  }
  const page = pages[previewPageIndex];
  let html = `<h2 class="text-lg font-semibold mb-4">${page.title}</h2>`;
  page.fields.forEach((f, idx) => {
    html += `<div class='mb-4'>
      <label class='block text-sm font-medium mb-1'>${f.label}${f.required ? "*" : ""}</label>`;
    if (f.type === "textarea") {
      html += `<textarea class='w-full px-3 py-2 rounded-xl border border-gray-200' placeholder="${f.placeholder || ""}" ${f.required ? "required" : ""}></textarea>`;
    } else if (f.type === "select") {
      html += `<select class='w-full px-3 py-2 rounded-xl border border-gray-200' ${f.required ? "required" : ""}>`;
      f.options.forEach(o => html += `<option>${o}</option>`);
      html += `</select>`;
    } else if (f.type === "checkbox") {
      html += `<input type='checkbox' ${f.required ? "required" : ""}/> <span class='text-sm'>${f.placeholder || ""}</span>`;
    } else {
      html += `<input type='${f.type}' class='w-full px-3 py-2 rounded-xl border border-gray-200' placeholder="${f.placeholder || ""}" ${f.required ? "required" : ""}/>`;
    }
    html += `</div>`;
  });
  previewArea.innerHTML = html;
}

// ---- Export ----

function generateExportHTML() {
  // Build a minimal self-contained HTML with inline CSS & JS
  const title = document.getElementById("formTitle").value || "Custom Form";
  const formData = { title, pages };
  const exportScript = `
<script>
const formData = ${JSON.stringify(formData)};
let currentPage = 0;
function showPage(){
  const container=document.getElementById("formPages");
  const page=formData.pages[currentPage];
  let html='<h2>'+page.title+'</h2>';
  page.fields.forEach(f=>{
    html+='<div class="mb-4"><label>'+f.label+(f.required?'*':'')+'</label>';
    if(f.type==='textarea'){
      html+='<textarea placeholder="'+(f.placeholder||'')+'" '+(f.required?'required':'')+'></textarea>';
    } else if(f.type==='select'){
      html+='<select '+(f.required?'required':'')+'>';
      f.options.forEach(o=>html+='<option>'+o+'</option>');
      html+='</select>';
    } else if(f.type==='checkbox'){
      html+='<input type="checkbox" '+(f.required?'required':'')+'>'+f.placeholder;
    } else {
      html+='<input type="'+f.type+'" placeholder="'+(f.placeholder||'')+'" '+(f.required?'required':'')+'/>';
    }
    html+='</div>';
  });
  container.innerHTML=html;
  document.getElementById("counter").innerText="Page "+(currentPage+1)+" / "+formData.pages.length;
}
function nextPage(){
  if(currentPage<formData.pages.length-1){currentPage++;showPage();}
  else alert("Submitted!");
}
function prevPage(){
  if(currentPage>0){currentPage--;showPage();}
}
window.onload=showPage;
<\/script>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>
body{font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto;background:#f5f6f7;padding:20px}
form{background:#fff;padding:20px;border-radius:20px;max-width:600px;margin:0 auto;box-shadow:0 6px 20px rgba(0,0,0,.05)}
input,select,textarea{display:block;width:100%;margin-top:4px;margin-bottom:12px;padding:10px;border-radius:12px;border:1px solid #ddd;font-size:14px}
button{padding:10px 20px;border-radius:20px;border:none;background:#000;color:#fff;font-weight:500;margin-top:10px}
label{font-size:14px;font-weight:500}
</style>
</head>
<body>
<form>
<h1>${title}</h1>
<div id="formPages"></div>
<div style="display:flex;justify-content:space-between;align-items:center">
<button type="button" onclick="prevPage()">Back</button>
<div id="counter" style="font-size:12px;color:#555"></div>
<button type="button" onclick="nextPage()">Next</button>
</div>
</form>
${exportScript}
</body>
</html>`;
}
