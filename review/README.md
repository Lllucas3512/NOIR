# NØIR — reconstrução da hero e do simulador

A reconstrução da versão 3 foi publicada com autorização do usuário. Esta revisão mantém essa arquitetura e acrescenta somente hold, regiões restauradas e acabamento das bordas.

## Diagnóstico

- A arte anterior era um gerador de flor e folhas simples. Nenhum ajuste de timing corrigiria sua falta de riqueza visual.
- A projeção anterior deformava a textura em 64 faixas iguais, independentemente de sua posição sobre o braço. Ela não representava a superfície anatômica.
- Cada pointermove executava toda a composição, incluindo filtro Canvas de blur em cada faixa. Esse é um gargalo concreto identificado no código; seu impacto no navegador não foi medido neste ambiente.
- Não foram encontrados listeners duplicados ou loop contínuo no componente anterior. A causa suspeita é trabalho excessivo por evento, não React (o projeto usa JavaScript sem framework).

## Alterações

- Nova arte de blackwork com retrato e folhagens, gerada por ImageGen. A imagem original transparente fica em `dist/assets/blackwork-master.png`.
- 595 contornos extraídos da própria arte, desenhados progressivamente. A hero tem 420svh, stencil temporário, três grupos de traço, 40 regiões de preenchimento com trajetos independentes e saída para preto depois da conclusão. O scroll normal controla tudo em ambos os sentidos.
- Simulador em WebGL sem dependências externas. Uma projeção cilíndrica inversa, parametrizada pelo contorno de cada fotografia, comprime a tattoo conforme ela se aproxima da lateral. Escala de 30% a 200%, rotação de -90° a 90°, intensidade, arraste e teclado.
- Máscara anatômica e perfis próprios de antebraço, braço e ombro. Composição multiplicativa preserva textura e iluminação.
- Malha Canvas como fallback de compatibilidade.
- Upload processado e recortado uma vez; remoção de fundo recalculada somente quando seu controle muda. Arraste não lê/processa pixels. Um único RAF pendente agrupa eventos por frame.
- Download e imagem do briefing usam a mesma renderização exibida.
- Conteúdo fora da hero e do simulador comparado byte a byte e preservado.

## Verificações realizadas

- Sintaxe dos dois arquivos JavaScript.
- Inicialização do app com assets reais em um harness DOM e Canvas nativo.
- Mil eventos pointermove produzem uma única renderização na próxima execução de RAF.
- Escala, rotação, intensidade, regiões, redefinição, preparação de imagem com fundo branco e snapshot do briefing.
- Dez estados da hero reproduzidos nos dois sentidos, com igualdade exata de pixels.
- Frame inicial totalmente transparente sobre a fotografia limpa.
- Inspeção visual de imagens do próprio renderizador Canvas: hero final, tattoos pequenas/grandes, esquerda/direita e três regiões.

Esses testes não substituem os testes no navegador. As imagens nesta pasta são renders do Canvas, não screenshots da página. A compilação e a fluidez do caminho WebGL, CSS em viewports desktop/mobile e o seletor nativo de upload ainda precisam ser conferidos no navegador.

## Bloqueio de infraestrutura

`sites-preview start` falhou com `bwrap: Can't mount proc on /newroot/proc: Operation not permitted`. O status confirmou a prévia parada. As orientações da skill Sites proíbem substituir a infraestrutura gerenciada para contornar essa falha. A limitação foi informada. O usuário autorizou a publicação da versão 3 sem essa validação; os testes abaixo continuam distinguindo Canvas nativo de revisão interativa em navegador.

## Roteiro de aceitação pendente

Abrir em desktop (1440×900) e mobile (390×844). Percorrer 0%, 20%, 40%, 60%, 80%, 90% e 100% da hero e retornar. Conferir alinhamento da arte, legibilidade, sticky e saída. No simulador, manipular repetidamente amostras e uploads PNG/JPG/WEBP nos extremos de escala e rotação, em centro e bordas. Verificar Console, FPS, crescimento de memória e imagem exportada. Publicar somente após resolver eventuais falhas.

## Atualização estrutural — versão 4

- Construção da hero preservada em 305,6svh de scroll; 80svh de hold explícito após 100%, antes de 14,4svh de transição. A classe HeroPainter e a arte aprovada permanecem idênticas.
- Sete regiões: Antebraço, Braço, Ombro, Coxa, Panturrilha, Peito e Costas. Cada uma tem foto, máscara, perfil anatômico, limites, proporção e curvatura próprios.
- Fotos extraídas do atlas já existente, em arquivos WebP individuais. Apenas a foto selecionada é carregada; uma única instância continua renderizando. Trocas assíncronas antigas não sobrescrevem a seleção atual.
- Campo de visibilidade calculado somente na troca de região. Combina distância à borda da máscara e oclusão angular, compartilhado pelo caminho WebGL e Canvas.
- O fallback Canvas recorta triângulos no horizonte da superfície em coordenadas da arte, em vez de descartar triângulos inteiros.
- Limites do centro seguem a pele visível: evitam enviar uma pequena tattoo para debaixo da camiseta no peito. Não há redução de escala máxima ou margem ampla.
- Parâmetro de arco ajusta a curvatura: membros continuam mais cilíndricos; peito e costas têm centro mais plano.
- Escala de 30% a 200%, rotação de -90° a 90°, upload, controles, intensidade e agrupamento por RAF mantidos.

Verificações: 49 cenários nativos (7 por região), com centro/laterais, pequena/média/grande, rotações e intensidades. Nenhum pixel de tinta fora da cobertura anatômica. Todas as regiões mostraram compressão lateral. Imagem de revisão em `seven-regions.png`; resultados numéricos em `seven-regions-checks.json`.

O teste de integração também passou: inicialização, sete trocas de região, mil eventos com um único render pendente, upload tratado, controles, briefing, dez estados reversíveis da hero e hold de 80vh sem fade. Conteúdo das demais seções e código de pintura da hero comparados e preservados exatamente.

A revisão interativa no navegador e medição de FPS real continuam sem verificação por indisponibilidade da prévia gerenciada. As imagens de revisão são renders do código Canvas, não screenshots da página.


## Correção de oclusão — versão 5

- A curva central foi preservada. Nas laterais, continuação com derivada finita substitui a compressão até largura zero. Coordenadas externas seguem fora da superfície visível, sem clamp para dentro da máscara.
- A silhueta recorta a projeção pronta. Removidos o fade angular e a faixa de transparência por distância; resta somente o antialiasing subpixel do contorno.
- Perfis laterais específicos por região; ombro usa uma calota convexa com componente vertical somente na lateral.
- O shader interpola o perfil com precisão maior nas laterais, eliminando degraus do antigo campo de 8 bits nessa faixa. Centro mantém o mapeamento anterior.
- HeroPainter, app.js, style.css e index.html comparados byte a byte com a versão 4 e preservados. Nenhuma mudança de interface, controles, escala máxima, upload, hold ou agendamento por RAF.

Verificação com o GLSL exato de produção compilado em EGL/OpenGL ES nativo (Mesa llvmpipe), não navegador: 63 casos, nove por região. Tattoo grande a 185%, centro, 25%/50% atravessando cada lateral, com 0°/35° de rotação. Nenhum pixel fora da máscara; diferença zero na região central opaca comparada com o shader da versão 4. Mais 49 verificações matemáticas de arco central, inversão, derivada lateral não nula e continuidade fora da silhueta. Imagens em occlusion-seven-regions.png e detalhes; resultados em occlusion-shader-checks.json.

Reproduzir: node scripts/export-occlusion.cjs; python scripts/render-occlusion-gl.py. Requer @napi-rs/canvas, Pillow, NumPy e EGL/Mesa. O exportador usa o commit publicado da versão 4 como comparação. Os arquivos intermediários ficam no diretório temporário do sistema (sobrescrevível por NOIR_OCCLUSION_QA).

O teste de integração Canvas também passou: sete regiões, controles, upload, briefing, mil eventos agrupados em um render, dez estados reversíveis da hero e hold. A revisão interativa e FPS no navegador continuam não medidos por indisponibilidade da prévia gerenciada; este teste adicional valida diretamente o shader usado pelo site.

## Correção do contorno fotografado — versão 6

O diagnóstico com grade mostrou que a máscara do antebraço não coincidia com a fotografia. Na borda direita, nas linhas y=50/150/300/450/600 da imagem de 900px, o recorte estava aproximadamente 7/8/13/9/4 pixels antes da transição real entre pele e fundo. A validação anterior usava a própria máscara como referência de acerto; verificava vazamento, mas não conseguia detectar essa faixa de pele excluída.

A função de projeção da versão 5 não converge para zero nessa faixa: a derivada lateral permanece finita e a geometria continua fora da silhueta. A grade mantém linhas separadas e largura positiva até a borda. Por isso, não houve nova alteração cosmética de curvatura, escala ou alpha. Corrigido somente o contorno do antebraço, traçado sobre a fotografia e simplificado com tolerância de 0,3px. O recorte agora coincide com a borda da pele, em vez de um contorno interno aproximado. Todas as funções de mapeamento/composição, controles, hero e outras seis regiões são idênticas à versão 5.

Validação visual: grade quadriculada e tattoo real no centro, duas laterais e rotação, antes/depois; tattoo grande (185%) e exemplo lateral a 100%. Imagens: `silhouette-grid-before-after.png`, `silhouette-tattoo-right.png` e `silhouette-contour-overlay.png` (ciano = máscara antiga; magenta = corrigida). O contorno foi comparado com o gradiente de cor da própria fotografia, com diferença de até 2px nas amostras verificadas, e os pixels da grade alcançam essa borda. A margem de 2px descreve a medição/antialiasing da foto; não é uma margem adicionada ao simulador.

Também passaram 63 cenários das sete regiões no GLSL de produção, sem vazamento, com igualdade dos pixels centrais comparados, mais o teste de integração Canvas. Código do site comparado: somente os dados da máscara do antebraço e seu comentário diferem da versão anterior. Não há processamento novo durante drag, escala ou rotação.

Reproduzir esta revisão: `NOIR_BASELINE_SHA=fae7e307cc56b4bd6438b90d1521818162f79c10 node scripts/export-occlusion.cjs`, `python scripts/render-occlusion-gl.py`, `python scripts/verify-silhouette-gl.py`. Os renders são do shader real executado em EGL/Mesa; não são screenshots de navegador. A prévia gerenciada não oferece servidor compatível com os assets estáticos deste projeto; não houve validação interativa em navegador.

## Simulador: seis silhuetas e preparação progressiva — versão 7

Escopo: somente máscara/alcance lateral das seis regiões restantes e carregamento/troca de região. Nenhum ZIP de entrega criado.

**Diagnóstico da projeção.** O antebraço da v6 resolveu o defeito alinhando a máscara com a fotografia, sem alterar o mapeamento. As outras seis regiões conservavam os contornos aproximados antigos. Havia faixas de pele excluídas, especialmente no ombro/axila e no braço; o limite de movimento também usava o perfil aproximado em vez da silhueta. Foram traçados contornos próprios de Braço, Ombro, Coxa, Panturrilha, Peito e Costas. Nessas seis regiões, o centro agora pode alcançar os limites da máscara real. O antebraço conserva exatamente seus dados, seus limites anteriores e seu resultado visual. Não mudou a matemática de projeção, UV, curvatura, alpha ou composição; cada perfil anatômico anterior permanece próprio.

**Diagnóstico da demora.** Antes, cada seleção criava uma nova Image; só então carregava/decodificava a foto, desenhava uma base de 900×900, rasterizava/lia/processava 810 mil pixels da máscara e subia duas texturas. Nenhum recurso preparado era reutilizado em novas seleções. Os arquivos WebP têm apenas 13–31KB. Medição nativa local anterior: decodificação de 2,4–5,3ms e cálculo da máscara de 6,1–28ms; o tempo de rede do usuário não é conhecido. Portanto, não foi atribuído todo o atraso ao tamanho dos arquivos.

**Otimizações.** Somente o antebraço continua sendo solicitado inicialmente. Quando a seção se aproxima da viewport (1200px), após hero e base inicial prontas, uma fila prepara as outras fotos em idle, uma por vez. Há decodificação explícita antecipada, cache das bases/máscaras/dados e coalescência de solicitações duplicadas. A escolha do usuário interrompe/prevalece sobre um carregamento de fundo; a seleção mais recente prevalece sobre respostas antigas. Cache CPU limitado às sete regiões; cache GPU LRU limitado a três pares de texturas. Nenhuma região tem render loop próprio. O limite teórico dos buffers RGBA persistidos nesse cache é 64,8MB (CPU+GPU), excluindo arte, buffers do navegador/driver e decodificação temporária; não é medição da memória total do browser. Os recursos originais de Image não são retidos depois da preparação. Recursos fora do LRU reaproveitam a base/máscara CPU e só refazem upload GPU, sem recálculo dos pixels.

O estado discreto de carregamento já existente continua sendo usado; a foto antiga fica oculta enquanto a seleção não está pronta. Arraste e exportação ficam protegidos durante esse intervalo. A imagem correta é revelada depois do primeiro render da nova região. Arte, escala, rotação e intensidade são preservadas na troca. Upload, remoção de fundo e briefing continuam funcionando.

**Testes efetivamente executados.**

- GLSL real compilado/renderizado por EGL/Mesa: 63 casos de tattoo grande nas sete regiões, com centro/laterais, 25%/50% ultrapassando e rotações. Sem vazamento fora das máscaras.
- 35 renders de grade, seis provas amplas de cobertura e 36 marcos da borda fotografada, com alinhamento dentro de 2px; inspeção visual das grades, tattoos e contornos. `v7-grid-seven-regions.png`, `v7-contours-before-after.png`, `v7-projection-checks.json`.
- Nove frames completos do antebraço comparados à v6: diferença zero em todos os pixels, inclusive nas bordas.
- Integração DOM/Canvas nativo: primeira troca para cada região, repetição sem novos carregamentos, pré-carregamento, prioridade da seleção, alternância rápida fria/quente, última seleção prevalecendo e somente um carregamento regional simultâneo. Estado de espera e bloqueio do drag; ajustes preservados. Fila inicial pede somente uma foto.
- Ciclo de vida WebGL instrumentado: máximo de três regiões GPU, reutilização sem uploads para regiões residentes e liberação das texturas. Esses contadores usam um adaptador de GL; a correção visual do shader foi testada separadamente no GL real.
- Testes existentes: mil pointermoves agrupados em um RAF, controles, upload, exportação/briefing, sete regiões, dez estados reversíveis da hero e hold de 80vh.
- Comparação de código: dados aprovados do antebraço, funções de projeção/UV/blend, shader, HeroPainter, hero no app, HTML, CSS, upload e formulário preservados exatamente.

No ensaio de cache, a preparação de seleção já aquecida ficou abaixo de 1ms no ambiente nativo. Os casos frios incluíram 35ms de atraso artificial para exercitar as corridas e o estado de espera; não representam tempo de rede real. A prévia estática não tem servidor compatível com a prévia gerenciada, portanto não houve teste interativo no navegador, medição real de FPS, Lighthouse, heap ou GPU do usuário. Se o usuário chegar ao simulador antes do pré-carregamento, ainda haverá uma espera discreta pela foto selecionada.

Reprodução: `NOIR_BASELINE_SHA=af89d57956202e801217fb24fa991b5153cd2d57 node scripts/export-occlusion.cjs`; `python scripts/render-occlusion-gl.py`; `python scripts/verify-v7-grid.py`; `node scripts/verify-region-cache.cjs`; `node scripts/verify-runtime.cjs`.

## v8 — Carregamento inicial, sem reconstrução visual

Diagnóstico: na entrada pelo topo, 7.024 MB de imagens/dados eram requisitados: hero PNG, atlas editorial abaixo da dobra, blackwork, contornos JSON e antebraço. O simulador também criava o renderer e processava a arte imediatamente. A fonte usava `@import` externo, adicionando uma descoberta sequencial. Não há framework ou biblioteca externa de animação para remover.

Alterações:
- Hero e atlas editorial em WebP **sem perdas**. RGBA idêntico ao original. Hero 1.809 → 1.251 MB; atlas 2.400 → 1.556 MB. Mesma resolução e enquadramento; não usamos uma imagem estreita em mobile porque a cena paisagem ocupa `177.78vh` e é recortada.
- Blackwork permanece no PNG original. O teste com WebP transparente revelou diferenças de premultiplicação no Canvas nativo; a conversão foi descartada para preservar os pixels renderizados.
- Atlas editorial solicitado somente a 800px da viewport; mesma fotografia/crop, com fallback sem IntersectionObserver e sem JS.
- HeroPainter extraído literalmente para arquivo crítico próprio. Engine e inicialização do simulador entram a 2000px da viewport (ou foco na seção), uma única vez. Preparação gradual anterior das sete regiões, uma por vez a 1200px, e caches CPU/GPU mantidos. Nenhuma fórmula, máscara, shader, controle ou limite foi alterado.
- Imagem master compartilhada por promessa entre hero e simulador, sem reter uploads no cache. Código de presets e processamento de upload também adiado.
- Fontes originais, mesmas famílias/estilos/pesos, hospedadas em WOFF2 com `swap`, sem `@import` externo; preload somente dos dois pesos normais críticos. Licenças incluídas.
- Hero priorizada com preload/fetchpriority, dimensões explícitas e decode assíncrono. Tattoo só informa progresso depois de pronta; erro faz uma tentativa de recuperação e exibe indisponibilidade sem bloquear navegação nem mudar scroll. Carregamento do módulo do simulador tem mensagem discreta e nova tentativa por toque/foco após erro.

Medições de arquivos (não tempos de rede/navegador): imagens/dados iniciais 7,024 → 4,054 MB (**−42,28%**), excluindo fontes/HTML/CSS e compressão HTTP. JS inicial 49.906 → 12.490 bytes (**−75%**; gzip 19.946 → 5.544 bytes). Hero isolada **−30,83%** sem mudar os pixels. Fontes usadas são carregadas sob demanda; duas recebem preload. Os PNGs de fotografia originais permanecem como fontes do projeto, sem requisições em runtime. Dados completos em `v8-performance.json`.

Não foi criada tela de loading: fotografia limpa, navegação e textos não precisam aguardar o simulador nem o portfólio. Não há comprovação em navegador de espera residual que justifique cobrir a hero; apenas o indicador existente sinaliza preparação se alguém rolar antes de a arte chegar. Sem temporizador de progresso, duração mínima, bloqueio de scroll ou overlay.

Validação realizada:
- Sintaxe, diff, três arquivos de imagem e comparação literal do engine aprovado; classe da hero idêntica.
- Dez frames da hero pixel a pixel contra v7, construção reversível, pele limpa, hold de 80vh e saída reversível.
- Harness com Canvas nativo: sete regiões, upload/processamento, escala/rotação/intensidade, briefing, mil pointermoves agrupados em um RAF.
- Carregamento adiado sem renderer/requests de corpo antes da aproximação; módulos coalescidos, erro de transporte e recuperação; estado de arte pendente/erro sem reset de scroll.
- Primeira seleção por região, cache aquecido, alternância rápida, prioridade sobre prewarm e descarte de respostas antigas. Uma carga de região por vez; GPU limitada a três regiões, cache CPU de sete, recursos liberados no destroy. Tempos do harness usam 35ms de atraso artificial, excluem desenho e não medem rede real.
- Shader de produção compilado/renderizado em EGL/llvmpipe: 63 poses de sete regiões (centro, laterais, grandes, rotacionadas), máscaras/centro preservados; inspeção das imagens renderizadas.

Limitação: projeto estático sem servidor de preview compatível no ambiente gerenciado. Não foram medidos LCP/INP/CLS/FCP/TBT, FPS, latência real, cold/warm HTTP, flashes de entrada ou comportamento interativo em navegador desktop/mobile. As reduções de bytes são reais; nenhuma meta de Core Web Vitals ou percentual de redução de tempo foi declarado como alcançado.
