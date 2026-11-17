# Sunflower Finance

Evolução do Galinha SF VIP para um painel de economia do **Sunflower Land**, com visual escuro e perfil inicial da fazenda Rafael #5782272679195539, Desert, atualizado pelo JSON de 17/11/2026.

## O que está disponível

- Visão geral com resultado por atividade, caixa projetado, Coins de fabricação, restocks compartilhados e meta VIP.
- Galinheiro com as 10 aves maduras e 5 em crescimento; XP individual, alimentação por lote, excedente preservado, Bale + Double Bale, Pig Onesie, Fat Chicken e skills por rank.
- Madeira: produção média, machados, simulação de Tree Blitz, compra/venda e preço de equilíbrio.
- Crimstone: sequência de 5 cortes, Fire Kissed, Gold Pickaxe e cadeia de fabricação por ouro, ferro e pedra.
- Sal: cargas regeneráveis, capacidade dos nós, visitas, ancinhos, madeira e bônus atuais.
- Preços manuais, origem e data, valor potencial do estoque e cálculo pendente quando faltar cotação.
- Entregas: estoque reservado, compra do faltante, recompensa e comparação com P2P.
- VIP: reserva em FLOWER, Gems reservadas, pacotes inteiros e prazo. ROI por lucro incremental.
- Importação do JSON da Community API ou de cenário exportado. Dados processados no navegador, sem chave de API ou login.
- Persistência local imediata e exportação de cenário com metadados.

**Os preços iniciais de ovos, penas e grãos são históricos de outubro. Os demais começam vazios.** Preencha as cotações atuais em “Preços & mercado” antes de avaliar a margem consolidada. A integração automática de marketplace ainda não está ativa.

## Usar o painel

1. Abra o site e confira “Minha fazenda”.
2. Em “Importar fazenda”, cole o Response body completo de **Get a farm**, ou selecione um JSON/TXT.
3. Preencha preços, taxa efetiva e pacote de Gems.
4. Ajuste sua agenda real em cada atividade. Não use frequência teórica se não conseguir coletar nesses horários.
5. Confira a memória de cálculo e se o resultado está parcial.
6. Exporte o cenário para guardar os parâmetros e a origem dos preços.

Atualizar somente a fazenda preserva as cotações e parâmetros manuais. O botão “Recarregar JSON de referência” restaura o perfil inicial, sem apagar preços.

### O que cada resultado significa

| Resultado | Critério |
| --- | --- |
| Caixa projetado | Vendas futuras estimadas menos compras necessárias depois do estoque inicial e pacotes de Gems a adquirir. Não é caixa realizado. |
| Margem de reposição | Venda líquida menos reposição de insumos e capacidade de restock amortizada. Não reutiliza estoque gratuito a cada período. |
| Lucro econômico | Margem de reposição menos a equivalência dos Coins. Se essa equivalência estiver vazia, fica pendente. |
| Custo de oportunidade | Compara transformar os insumos próprios com vendê-los pelo líquido. Não soma reposição e oportunidade para o mesmo item. |

O consolidado pode reter madeira produzida para fabricação, vendendo só o excedente. As linhas por atividade mostram cenários individuais; o ajuste aparece abaixo da tabela.

## Desenvolvimento local

O site publicado não exige build nem CDN. JavaScript em módulos e `decimal.js` vendorizada mantêm o deploy estático.

```sh
npm ci --ignore-scripts
npm test
npm start
```

Acesse `http://127.0.0.1:52189`. Não abra `index.html` por `file://`: importação de módulos e leitura do perfil exigem HTTP.

Arquivos principais:

- `index.html`: shell acessível, navegação e dialog de importação.
- `styles.css`: tokens, layout escuro, responsividade e reduced-motion.
- `app.mjs`: telas, formulários, persistência, importação/exportação.
- `engine.mjs`: regras e funções econômicas independentes da interface.
- `data/profile.json`: perfil de referência reduzido; sem credenciais, carteira, Telegram, Discord ou dados de autenticação.
- `tests/economy.test.mjs`: benchmarks históricos e regressões relevantes.
- `docs/AUDITORIA.md`: evidências, fontes oficiais e limites do modelo.
- `design-system/sunflower-finance/MASTER.md`: decisões de UI/UX.
- `legacy.html`: calculadora anterior, com seu armazenamento original intacto.

## GitHub Pages

Foi preservado o pipeline existente: **Deploy from branch**, `main`, `/ (root)`. Não é necessário trocar de provedor, configurar secrets ou contratar serviços.

Endereço: [Sunflower Finance](https://generosorafa.github.io/GalinhaSFVip/). O caminho antigo permanece para evitar quebrar links existentes; o nome exibido muda para Sunflower Finance.

## Fontes e limites

Leia [a auditoria](docs/AUDITORIA.md). A rota recursiva de mineração é análise de custo e não garante capacidade física dos nós ou abastecimento no prazo. O cultivo usa cobertura manual e plots-equivalentes; não substitui um calendário completo. Afeto futuro, cura, bônus temporários e equipamentos não reconhecidos exigem parâmetros ou validação adicional.

Ícones [Phosphor](https://phosphoricons.com/) (MIT), incluídos localmente. Cálculos com [decimal.js](https://github.com/MikeMcl/decimal.js) (MIT). Foram aplicadas UI/UX Pro Max, Web Design Guidelines e Design Motion Principles. A estrutura HTML/JS existente foi mantida; shadcn/ui não foi adicionado porque exigiria introduzir React sem necessidade funcional.
