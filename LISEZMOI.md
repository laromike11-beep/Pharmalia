# Pharmalia : boutique, panneau admin et panneau confirmateur

Trois pages, une base de données commune (Supabase).

| Page | Qui | Rôle |
|---|---|---|
| `index.html` | Clients (public) | Boutique : produits, marques, catégories, panier, formulaire de commande, page de remerciement |
| `confirmateur.html` | Confirmateurs | File d'attente, appel du client, confirmer / pas de réponse / reporter / annuler |
| `admin.html` | Administrateur | Tableau de bord, commandes, produits, marques (logos), catégories, équipe |

Chaque produit doit avoir **une marque et une catégorie** (la base refuse sinon). Les pages « Nos marques » et « Catégories » de la boutique regroupent les produits par marque et par catégorie. Le logo d'une marque se téléverse dans l'admin (onglet Marques).

---

## Installation (environ 20 minutes)

### 1. Créer la base (gratuit)
1. Créez un compte sur https://supabase.com puis un nouveau projet.
2. Menu **SQL Editor** > New query > collez tout le contenu de `supabase/schema.sql` > **Run**.
   Cela crée les tables, les règles de sécurité, les fonctions et quelques exemples de produits.

### 2. Sécuriser les comptes
- **Authentication > Providers > Email** : désactivez **Allow new users to sign up**. Ainsi, personne ne peut se créer un compte : seuls ceux que vous ajoutez peuvent se connecter.

### 3. Créer votre compte administrateur
1. **Authentication > Users > Add user** : saisissez votre email et un mot de passe (cochez « Auto confirm user »).
2. Retournez dans **SQL Editor** et exécutez (avec votre email) :
   ```sql
   update public.profiles set role = 'admin' where email = 'votre@email.dz';
   ```

### 4. Relier le site
1. **Project Settings > API** : copiez l'**URL** du projet et la clé **anon public**.
2. Ouvrez `config.js` et remplissez `supabaseUrl` et `supabaseKey`, ainsi que le nom, le téléphone, le numéro WhatsApp et l'email de votre boutique.
   N'utilisez jamais la clé `service_role` dans ces fichiers.

### 5. Mettre en ligne
Déposez le dossier entier sur un hébergement statique gratuit, par exemple **Netlify** (glisser-déposer le dossier sur app.netlify.com/drop) ou **Vercel** / **Cloudflare Pages**. Vous obtenez une adresse, que vous pouvez remplacer par votre nom de domaine.
- Boutique : `https://votre-site/`
- Confirmateurs : `https://votre-site/confirmateur.html`
- Administration : `https://votre-site/admin.html`

### 6. Premiers pas dans l'admin
1. Ouvrez `admin.html` et connectez-vous.
2. **Marques** : ajoutez vos marques et téléversez leur logo. **Catégories** : créez ou renommez les catégories.
3. **Produits** : ajoutez-les un par un (marque et catégorie obligatoires), ou utilisez **Importer** pour coller une liste depuis Excel :
   `Marque ; Catégorie ; Nom ; Contenance ; Prix ; Quantité min.`
   Les marques et catégories absentes sont créées automatiquement.
4. Supprimez les produits, marques et catégories d'exemple.
5. **Équipe** : pour ajouter un confirmateur, créez son compte dans Supabase (Authentication > Users > Add user). Il apparaît dans l'onglet Équipe : choisissez son rôle « Confirmateur ».

---

## Changer le logo, le nom et les couleurs
Tout se règle dans `config.js`, sans toucher au reste :
- `name` : le nom de votre boutique.
- `logo` : le nom de votre fichier logo (ex. `"logo.png"`), déposé dans le même dossier que `index.html`. Il remplace l'icône sur la boutique et sur les deux panneaux. Mettez `logoOnly: true` si votre logo contient déjà le nom.
- `colorBrand` : votre couleur principale (ex. `"#1b5fa8"`). Les tons clairs et foncés en sont déduits.
- `colorAccent` : la couleur des boutons de validation.
Les logos des **marques que vous vendez** se téléversent séparément, dans l'admin (onglet Marques).

## Comment les commandes circulent
1. Le client valide son panier, remplit le formulaire (nom, téléphone, wilaya, commune, adresse, livraison) et arrive sur la page de remerciement avec son numéro de commande.
2. La commande arrive en statut **Nouvelle**, dans la **file d'attente** des confirmateurs (mise à jour en direct).
3. Le confirmateur clique « Prendre la prochaine commande », appelle le client, puis choisit : **Confirmer**, **Pas de réponse** (le nombre d'appels est compté), **Reporter** (avec une date de rappel) ou **Annuler** (raison obligatoire). Il peut corriger l'adresse avant de confirmer.
4. L'admin voit tout, peut répartir les nouvelles commandes entre les confirmateurs, passer les commandes en **Expédiée / Livrée / Retournée**, et exporter les commandes en CSV pour la livraison.
5. Chaque changement de statut est gardé dans l'historique de la commande.

## Sécurité
- Les prix et quantités minimales sont recalculés par la base au moment de la commande. Un client ne peut pas les modifier.
- Un confirmateur ne voit que la file d'attente et ses propres commandes, et ne peut pas toucher aux produits ni aux prix.
- Le public ne peut pas lire les commandes. La clé `anon` visible dans `config.js` est faite pour ça, la sécurité vient des règles de la base.
- Un champ piège invisible (anti-robot) est présent dans le formulaire. Si vous recevez du spam, activez la protection anti-robots de votre hébergeur.

## Ce qui n'est pas inclus
- Gestion du stock (le champ existe, mais n'est pas décrémenté), envoi de SMS, intégration avec une société de livraison et frais de livraison par wilaya.
- Mode sombre/clair : la boutique et les panneaux suivent le thème du téléphone ou de l'ordinateur.

## Essayer sans Supabase
Si `config.js` n'est pas rempli, `index.html` s'ouvre avec des produits d'exemple (les commandes ne sont pas enregistrées). Les panneaux affichent « Configuration manquante ».
