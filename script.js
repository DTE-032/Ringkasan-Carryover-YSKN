(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const sidebar = $("#sidebar");
  const menuToggle = $("#menuToggle");
  const backdrop = $("#sidebarBackdrop");
  const toast = $("#toast");
  let toastTimer;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2800);
  }

  function setMenu(open) {
    sidebar.classList.toggle("open", open);
    backdrop.hidden = !open;
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Tutup navigasi" : "Buka navigasi");
    document.body.style.overflow = open ? "hidden" : "";
  }

  menuToggle.addEventListener("click", () => setMenu(!sidebar.classList.contains("open")));
  backdrop.addEventListener("click", () => setMenu(false));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") setMenu(false);
  });

  const navLinks = $$("[data-section]");
  function setActiveSection(id) {
    navLinks.forEach(link => {
      const active = link.dataset.section === id;
      link.classList.toggle("active", active);
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }
  navLinks.forEach(link => link.addEventListener("click", event => {
    const target = document.getElementById(link.dataset.section);
    if (!target) {
      event.preventDefault();
      showToast("Bagian yang dituju tidak ditemukan.");
      return;
    }
    setActiveSection(link.dataset.section);
    setMenu(false);
  }));

  const observedSections = ["ringkasan", "program", "pencapaian", "carryover", "prioritas"]
    .map(id => document.getElementById(id)).filter(Boolean);
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActiveSection(visible.target.id);
    }, { rootMargin: "-22% 0px -62% 0px", threshold: [0, .15, .35, .6] });
    observedSections.forEach(section => observer.observe(section));
  }

  function setupFilter(inputId, listId, countId, emptyId, singular, plural) {
    const input = document.getElementById(inputId);
    const list = document.getElementById(listId);
    const count = document.getElementById(countId);
    const empty = document.getElementById(emptyId);
    if (!input || !list || !count || !empty) return;
    const items = $$(".task-card, .carryover-card", list);
    const filter = () => {
      const query = input.value.trim().toLocaleLowerCase("id-ID");
      let shown = 0;
      items.forEach(item => {
        const haystack = `${item.dataset.search || ""} ${item.textContent}`.toLocaleLowerCase("id-ID");
        const matches = !query || haystack.includes(query);
        item.hidden = !matches;
        if (matches) shown++;
      });
      count.textContent = `${shown} ${shown === 1 ? singular : plural}`;
      empty.hidden = shown !== 0;
    };
    input.addEventListener("input", filter);
  }
  setupFilter("accomplishmentSearch", "accomplishmentList", "accomplishmentCount", "accomplishmentEmpty", "kegiatan", "kegiatan");
  setupFilter("carryoverSearch", "carryoverList", "carryoverCount", "carryoverEmpty", "pekerjaan", "pekerjaan");

  $("#printBtn").addEventListener("click", () => window.print());

  $("#exportBtn").addEventListener("click", () => {
    const rows = [
      ["Kategori", "Nama", "Rincian", "Status"],
      ["Pencapaian", "Bantuan bencana Sikka, NTT", "Penyaluran paket sembako dan perlengkapan darurat bagi keluarga terdampak bencana.", "Selesai"],
      ["Pencapaian", "Operasional rumah singgah Jakarta", "Hunian sementara dan dukungan nutrisi harian bagi pasien anak di sekitar RSCM.", "Selesai"],
      ["Pencapaian", "Transportasi ambulans gratis", "Pengantaran pasien kurang mampu antar fasilitas kesehatan.", "Selesai"],
      ["Pencapaian", "Pelatihan mitigasi Sesar Lembang", "Lokakarya keselamatan gempa dan mitigasi bencana bagi warga sekitar.", "Selesai"],
      ["Pencapaian", "Monitoring konservasi lingkungan", "Pemeriksaan area penanaman pohon lokal dan pendampingan bank sampah.", "Selesai"],
      ["Pencapaian", "Penyaluran sembako mingguan", "Paket pangan untuk lansia, pekerja informal, dan keluarga prasejahtera.", "Selesai"],
      ["Pencapaian", "Pembaruan kampanye digital", "Pembaruan data dan pencapaian platform penggalangan dana.", "Selesai"],
      ["Tindak lanjut", "Pengadaan material perpipaan air bersih", "Finalisasi kontrak vendor untuk proyek perpipaan air di 14 desa di Bener Meriah.", "Belum selesai"],
      ["Tindak lanjut", "Servis rutin armada ambulans", "Pemeriksaan mekanis dan pemeliharaan armada.", "Belum selesai"],
      ["Tindak lanjut", "Pelaporan keuangan kuartalan", "Penyusunan laporan untuk mitra korporasi.", "Belum selesai"],
      ["Tindak lanjut", "Pendaftaran peserta edukasi lingkungan", "Pendataan guru dan siswa untuk kelas kesadaran lingkungan.", "Belum selesai"],
      ["Prioritas", "Kontrak dan pengiriman material air bersih", "Finalisasi vendor dan koordinasi pengiriman material.", "Prioritas tinggi"],
      ["Prioritas", "Pemeliharaan dan inspeksi ambulans", "Jadwalkan servis rutin dan pemeriksaan kendaraan.", "Prioritas"],
      ["Prioritas", "Finalisasi laporan pertanggungjawaban hibah", "Lengkapi laporan akuntabilitas donasi korporasi.", "Prioritas"]
    ];
    const csv = "\uFEFF" + rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "ringkasan-operasional-YSKN-2026.csv";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast("Data berhasil disiapkan untuk diunduh dalam format CSV.");
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 960) setMenu(false);
  });
  window.addEventListener("orientationchange", () => setMenu(false));
})();