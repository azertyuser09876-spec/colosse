// Fin des ajouts de la 3.1 : les listes dérivées des données (clés triées, armes forgeables, modules, cerveaux) sont remises à jour
// une fois tous les fichiers 04-plus-*.js chargés, avant la lecture de la sauvegarde.
(() => {
  CHASSIS_KEYS.length = 0; Object.keys(CHASSIS).sort((a, b) => CHASSIS[a].tier - CHASSIS[b].tier).forEach(k => CHASSIS_KEYS.push(k));
  for (const k in WEAPONS) if (!WEAPONS[k].hidden && !CRAFT_WEAPONS.includes(k)) CRAFT_WEAPONS.push(k);
  for (const k in MODULES) if (!MODULE_KEYS.includes(k)) MODULE_KEYS.push(k);
  for (const k in BRAINS) if (!BRAIN_KEYS.includes(k)) BRAIN_KEYS.push(k);
  for (const r of RESEARCH) RESEARCH_BY_ID[r.id] = r;
  // toute technologie restée sans famille rejoint « Autres » dans sa branche
  const seen = new Set(RT_BRANCHES.flatMap(b => b.fam.flatMap(f => f.ids)));
  const brOf = id => id[0] === 'c' ? 'ch' : id[0] === 'w' ? 'w' : id[0] === 'm' || id[0] === 'b' ? 'eq' : 'pi';
  for (const r of RESEARCH) if (!seen.has(r.id)) { const B = RT_BRANCHES.find(b => b.id === brOf(r.id)); let f = B.fam.find(x => x.id === 'autres'); if (!f) B.fam.push(f = { id: 'autres', n: TL('Autres'), ids: [] }); f.ids.push(r.id); }
  for (const B of RT_BRANCHES) B.fam = B.fam.filter(f => f.ids.length);
  // projectiles qui ne sont pas des objets physiques (ondes, câbles, effets) : ni la phalange ni les antimissiles ne les abattent
  for (const k of ['a_ice', 'a_iceh', 'a_ret', 'a_pulse', 'sonic', 'tether', 'xc_fix', 'xc_dead', 'xc_sky', 'xc_phase']) if (B_KIND[k]) B_KIND[k].pd = false;
  // lumière de nuit : seules les zones qui brillent vraiment éclairent le sol ([rayon, couleur, intensité])
  const LZ = { a_acid: f => [f.r * 1.6 + 30, '#9fe06a', .35], xb_pwall: f => [(f.hl || 450) * 1.1, '#ff8a4a', .8], xb_cage: f => [f.r * 1.4, '#a8e4ff', .55], xb_seism: f => null,
    xc_volcano: f => [f.r * 4 + 200, '#ff6a20', .9], xc_solar: f => [700, '#fff0b0', .9], xc_nova: f => [f.r * 1.2 || 1200, '#fff8e0', .9], xc_storm: f => [900, '#c8e8ff', .3], xb_tornado: f => null };
  for (const k in LZ) if (ZONE_K[k]) ZONE_K[k].light = LZ[k];
})();
