# NØIR Tattoo Atelier — versão 8

Pacote da versão publicada, sem alterações no código do site.
Commit: 8d1e05acd3e73e8aad5e34b30fffabc7385355c5

## Abrir no Antigravity

1. Extraia o ZIP.
2. Abra a pasta `NOIR-Tattoo-Atelier-v8` como projeto.
3. Os arquivos do site estão em `dist/`. É um site estático em HTML, CSS e JavaScript, sem instalação de dependências e sem etapa de build.
4. Sirva `dist/` por HTTP para visualizar. Se houver Python instalado, execute na raiz do projeto:

   `python -m http.server 8000 --directory dist`

   Abra `http://localhost:8000` no navegador. Evite abrir o HTML diretamente por `file://`, pois a hero carrega dados com fetch.
5. Ao hospedar, a pasta pública é `dist/`. Este pacote não configura nem publica automaticamente em Cloudflare, GitHub ou outro serviço.

## Arquivos principais

- `dist/index.html`: seções e conteúdo.
- `dist/style.css`: identidade visual e responsividade.
- `dist/app.js`: hero/scroll, navegação, galeria, briefing e carregamento adiado do simulador.
- `dist/hero-painter.js`: construção da tattoo da hero.
- `dist/simulator.js`: controles, upload, preparação de recursos e cache.
- `dist/ink-engine.js`: projeções, máscaras, shaders e fallback Canvas.
- `dist/assets/`: fotografias, tattoos, contornos e fontes locais com licenças.
- `review/`: histórico técnico, medições e renders de validação. As notas antigas documentam etapas anteriores; consulte a seção v8 do README para o estado atual.
- `scripts/`: ferramentas e testes usados no ambiente de desenvolvimento original. Alguns dependem de caminhos absolutos, histórico Git, Canvas nativo e EGL/llvmpipe; não são necessários para executar o site e não constituem uma suíte portátil pronta para rodar neste ZIP.
- `MANIFEST-SHA256.json`: hashes dos arquivos exportados para conferir integridade.

## Preservar nas próximas alterações

A hero, seu desenho, construção reversível, duração e hold estão aprovados. A projeção curva das sete regiões e especialmente o antebraço estão aprovados. Preserve máscaras, oclusão, escala, rotação, intensidade, upload, remoção de fundo, exportação e renderização agrupada por frame.

Preserve também a inicialização adiada, pré-carregamento gradual, cache e fontes locais da v8. O blackwork continua em PNG deliberadamente: o teste da versão WebP transparente apresentou diferenças de decodificação no renderizador nativo.

Pendências visuais anteriormente reservadas para avaliação no Antigravity, sem execução neste pacote:
- Diversificar trabalhos repetidos do portfólio.
- Refinar/substituir a imagem do atelier com aparência mais natural.
- Melhorar os presets genéricos do simulador, preservando a primeira opção aprovada.

Essas pendências não autorizam reconstruir a hero ou o simulador.

## Estado funcional e validação

O formulário prepara um briefing para download; não envia dados e não confirma agendamento. O atelier, artistas e imagens são conceituais.

A v8 teve testes de Canvas/GLSL nativos, hero reversível, hold, sete regiões, cache, controles e recuperação de carregamento. Não foram medidos Core Web Vitals, rede real nem comportamento completo em navegador desktop/mobile. Faça essa validação no ambiente do Antigravity antes da publicação final.

O ZIP não contém histórico Git, credenciais, configuração de publicação do ambiente anterior nem arquivos ZIP antigos. Todos os arquivos de `dist/`, `review/` e `scripts/` foram exportados sem alterações do commit indicado.
