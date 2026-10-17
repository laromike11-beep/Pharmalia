/* Code commun aux panneaux admin et confirmateur */
const CFG = window.CONFIG || {};
const sb = (CFG.supabaseUrl && CFG.supabaseKey && window.supabase)
  ? window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey) : null;

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
const fmt = n => Number(n || 0).toLocaleString("fr-DZ").replace(/[  ]/g, " ") + " DA";
const fdate = iso => iso ? new Date(iso).toLocaleString("fr-DZ", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "";
const slugify = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/&/g, " ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
function rel(iso) {
  const m = Math.round((Date.now() - new Date(iso)) / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${Math.round(h / 24)} j`;
}

const STATUS = {
  nouvelle: ["Nouvelle", "blue"], confirmee: ["Confirmée", "green"], pas_de_reponse: ["Pas de réponse", "amber"],
  reportee: ["Reportée", "violet"], annulee: ["Annulée", "red"], expediee: ["Expédiée", "teal"],
  livree: ["Livrée", "green"], retournee: ["Retournée", "red"]
};
const chip = s => `<span class="st ${(STATUS[s] || ["", "grey"])[1]}">${(STATUS[s] || [s])[0]}</span>`;

const WILAYAS = ["Adrar", "Chlef", "Laghouat", "Oum El Bouaghi", "Batna", "Béjaïa", "Biskra", "Béchar", "Blida", "Bouira", "Tamanrasset", "Tébessa", "Tlemcen", "Tiaret", "Tizi Ouzou", "Alger", "Djelfa", "Jijel", "Sétif", "Saïda", "Skikda", "Sidi Bel Abbès", "Annaba", "Guelma", "Constantine", "Médéa", "Mostaganem", "M'Sila", "Mascara", "Ouargla", "Oran", "El Bayadh", "Illizi", "Bordj Bou Arréridj", "Boumerdès", "El Tarf", "Tindouf", "Tissemsilt", "El Oued", "Khenchela", "Souk Ahras", "Tipaza", "Mila", "Aïn Defla", "Naâma", "Aïn Témouchent", "Ghardaïa", "Relizane"];
const wilayaOptions = sel => WILAYAS.map(w => `<option ${w === sel ? "selected" : ""}>${esc(w)}</option>`).join("");

function toast(msg) {
  let t = $("#toast");
  if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
  t.textContent = msg; t.classList.add("on");
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("on"), 2200);
}

const logoInner = tag => (CFG.logo ? `<img class="logo-img" src="${esc(CFG.logo)}" alt="">` : `<i><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></i>`)
  + (CFG.logoOnly && CFG.logo ? "" : `<span>${esc(CFG.name || "Pharmalia")}</span>`) + `<small>${esc(tag)}</small>`;
/* couleurs de la marque (config.js) */
(function () {
  const st = document.documentElement.style;
  if (CFG.colorBrand) {
    st.setProperty("--brand", CFG.colorBrand);
    st.setProperty("--brand-soft", `color-mix(in srgb, ${CFG.colorBrand} 13%, #fff)`);
    st.setProperty("--bar", `color-mix(in srgb, ${CFG.colorBrand} 60%, #000)`);
  }
  if (CFG.colorAccent) st.setProperty("--accent", CFG.colorAccent);
})();

/* Connexion + contrôle du rôle. onReady(profil) est appelé une fois l'accès validé. */
async function boot(roles, onReady) {
  const auth = $("#auth"), app = $("#app");
  const card = html => { auth.hidden = false; app.hidden = true; auth.innerHTML = `<div class="login"><div class="card">${html}</div></div>`; };
  if (!sb) {
    card(`<h1>Configuration manquante</h1><p>Renseignez <b>supabaseUrl</b> et <b>supabaseKey</b> dans config.js (voir LISEZMOI.md).</p>`);
    return;
  }
  const { data: { session } } = await sb.auth.getSession();
  if (!session) {
    card(`<h1>Connexion</h1><p>Espace réservé à l'équipe.</p>
      <form id="loginForm">
        <div class="fld"><label for="lg_email">Email</label><input id="lg_email" type="email" autocomplete="username" required></div>
        <div class="fld"><label for="lg_pw">Mot de passe</label><input id="lg_pw" type="password" autocomplete="current-password" required></div>
        <p class="err" id="lg_err"></p>
        <button class="btn" style="width:100%" id="lg_btn">Se connecter</button>
      </form>`);
    $("#loginForm").addEventListener("submit", async e => {
      e.preventDefault();
      $("#lg_btn").disabled = true;
      const { error } = await sb.auth.signInWithPassword({ email: $("#lg_email").value.trim(), password: $("#lg_pw").value });
      if (error) { $("#lg_err").textContent = "Email ou mot de passe incorrect."; $("#lg_btn").disabled = false; return; }
      boot(roles, onReady);
    });
    return;
  }
  const { data: prof } = await sb.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
  if (!prof || !roles.includes(prof.role)) {
    card(`<h1>Accès refusé</h1><p>${prof && prof.role === "none" ? "Votre compte n'a pas encore de rôle. Demandez à l'administrateur de vous en attribuer un." : "Votre rôle ne donne pas accès à cette page."}</p>
      <button class="btn grey" id="lo">Se déconnecter</button>`);
    $("#lo").onclick = logout;
    return;
  }
  auth.hidden = true; app.hidden = false;
  onReady(prof);
}
async function logout() { await sb.auth.signOut(); location.reload(); }
