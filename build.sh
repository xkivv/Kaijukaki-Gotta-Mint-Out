#!/bin/bash
# Monta o jogo. Sem bundler, sem npm: e cat de arquivos numa ordem fixa.
# Roda de qualquer pasta — os caminhos sao relativos a este arquivo.
set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
S="$ROOT/src"
D="$ROOT/dist"
mkdir -p "$D" "$ROOT/desktop/app"
build(){  # $1 = arte, $2 = saida, $3 = mapa real
{
  cat $S/00-head.html
  echo '<style>'
  cat $S/10-base.css $S/11-window.css $S/12-apps.css $S/13-fx.css $S/15-market.css $S/16-social.css $S/17-mint.css $S/19-onboard.css $S/20-shop.css $S/21-legible.css $S/21b-leg-shell.css $S/21b-leg-market.css $S/21b-leg-social.css $S/21b-leg-shop.css $S/22-desk.css $S/23-quests.css $S/24-spot.css $S/25-size.css $S/26-dm.css $S/27-story.css $S/28-storylog.css $S/21c-contrast.css $S/14-mobile.css
  echo '</style>'
  cat $S/05-body.html
  echo '<script>'
  cat $S/$1 $S/$3 $S/18b-meta.js $S/19-i18n.js $S/20-util.js $S/21-icons.js $S/22-data.js $S/23-art.js $S/24-state.js $S/24a-prefs.js \
      $S/25-wm.js $S/26-flow.js $S/30-app-site.js $S/31-app-market.js \
      $S/32-app-wallet.js $S/33-app-vault.js $S/34-app-misc.js $S/35-doodle.js $S/36-music.js $S/37-shell.js $S/38-app-binder.js $S/39-enemies.js $S/41-app-chart.js $S/42-hubs.js $S/43-mobile.js $S/44-app-inbox.js $S/45-widgets.js $S/46-codefx.js $S/47-fx-bigsale.js $S/48-quests.js $S/49-social-data.js $S/50-social.js $S/51-app-social.js $S/55-dm.js $S/56-dm-lines.js $S/57-dm-echo.js $S/58-story.js $S/59-story-log.js $S/52-spotter.js $S/54-collection.js $S/40-boot.js
  echo '</script>'
} > "$2"
echo "built: $2  $(( $(wc -c < "$2") / 1024 )) KB"
}
# a build publica: arte embutida, SEM o mapa real
build 18a-sheets.js "$D/kaijukaki.html" 18c-noreal.js
# a build de desktop: arte em arquivo, SEM o mapa real
build 18a-files.js "$ROOT/desktop/app/index.html" 18c-noreal.js
# a build "local" do dono: le os PNGs de 300px do disco, ao lado da colecao.
# Neste pacote 18c-real.js esta vazio, entao ela sai igual a publica sem arte.
build 18a-nosheets.js "$D/kaijukaki-local.html" 18c-real.js
