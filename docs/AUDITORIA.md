# Auditoria e evolução — 17/11/2026

Base: generosorafa/GalinhaSFVip, commit `1ef0345` (Audit and correct chicken economics engine). Publicação existente: GitHub Pages, branch main, raiz.

## O que foi preservado

- Hospedagem estática sem servidor de aplicação, conta adicional ou credencial no navegador.
- Calculadora anterior em `legacy.html`, com seu localStorage original `galinha-sf-vip:v1` intacto.
- Comparações de P2P, plantio, Coins, Gems, restock, VIP e custo de oportunidade.
- Português brasileiro e horários America/Sao_Paulo.

## Divergências encontradas e tratamento

| Evidência no código anterior | Impacto | Implementação nova |
| --- | --- | --- |
| `getFeedModel` aplica apenas Efficient Feeding e Chonky à quantidade | Ignora Fat Chicken e Clucky Grazing ativos | `engine.mjs: feedMultipliers` usa collectibles colocados e ranks |
| XP da ração considera apenas Chonky | Pig Onesie do perfil aumenta XP por porção | `nextFeed` aplica x1,05 quando equipado no Bumpkin ou farmhand |
| `getOutputPerChicken` soma só Abundant Harvest/Fine Fibers | 52 ovos em vez de 54 nas 10 maduras com Bale e Double Bale | `birdOutput` reproduz 54/31 nesse cenário |
| Nível único, fixado em 15 na interface | Ignora as 5 novas aves e transição de XP | Simulação individual com marcas de coleta e XP excedente |
| Média linear chamada de feeding engine | Não representa o lote inteiro da próxima ação | Próxima ação usa ceil; modelo de setembro permanece como fixture e no histórico |
| Laurie OFF por padrão; perfil e preços de setembro | Não representa perfil de novembro | Importação do JSON, posse distinta de colocação e preços históricos explicitamente datados |
| `cashProfit` subtrai Gems equivalentes como desembolso FLOWER | Confunde consumir Gems com comprá-las | Caixa projetado calcula pacotes inteiros acima das Gems liberadas; reposição amortiza Gems consumidas |
| Páginas e parâmetros concentrados em um HTML | Dificulta navegar e auditar | Shell, estilos, UI e motor separados; navegação por hash |
| Switches com input `display:none`, sem reduced-motion | Prejudica teclado e preferências de movimento | Checkbox nativo, foco visível, dialog semântico e reduced-motion |

## Novos módulos

- Madeira: média por árvore, Tough Tree por rank, Squirrel ativo, rodada de Tree Blitz, machados, compra versus venda e preço de equilíbrio.
- Crimstone: sequência `minesLeft`, bônus do quinto corte, reinício após mais de 48 horas, Gold Pickaxe e cadeia recursiva Gold → Iron → Stone. Rendimentos de minério são parâmetros editáveis.
- Sal: nós reais de `saltFarm.nodes`, cargas, capacidade da Sculpture, tempo de regeneração, Wide Rakes, ancinhos e madeira. Ao colher um nó cheio, a próxima carga começa um novo intervalo.
- Ferreiro: demanda conjunta, ferramentas prontas, estoque real da loja, reposição compartilhada e shipment gratuito. Betty é separada.
- Consolidado: madeira usada internamente não aparece ao mesmo tempo como vendida e comprada. Margens por atividade permanecem independentes e o ajuste de consolidação é exposto.
- Entregas: estoque próprio reservado uma vez, custo de obter o faltante, diferença para P2P, Coins e XP separados. Cadastro simples por item; JSON de cenário aceita listas de itens.
- VIP: reserva explícita, prazo, pacotes inteiros de Gems e saldo de Gems separado da operação.
- ROI: preço versus ganho líquido incremental, sem payback para delta não positivo.
- Importar/exportar cenário e JSON da fazenda; preços e alterações manuais preservados ao atualizar só a fazenda.

## Fontes primárias

Código oficial em `sunflower-land/sunflower-land`, branch main, consultado em 17/11/2026. O main pode avançar antes de a mesma regra chegar a todas as versões do jogo; parâmetros operacionais permanecem editáveis.

- [Skills, ranks e custos](https://github.com/sunflower-land/sunflower-land/blob/main/src/features/game/types/bumpkinSkills.ts)
- [Alimentação em lote e XP](https://github.com/sunflower-land/sunflower-land/blob/main/src/features/game/events/landExpansion/feedAnimal.ts)
- [Marcas de coleta, Bale e quantidade de ração](https://github.com/sunflower-land/sunflower-land/blob/main/src/features/game/lib/animals.ts)
- [Receitas e níveis de animais](https://github.com/sunflower-land/sunflower-land/blob/main/src/features/game/types/animals.ts)
- [Madeira](https://github.com/sunflower-land/sunflower-land/blob/main/src/features/game/events/landExpansion/chop.ts)
- [Crimstone](https://github.com/sunflower-land/sunflower-land/blob/main/src/features/game/events/landExpansion/mineCrimstone.ts)
- [Regras do sal](https://github.com/sunflower-land/sunflower-land/blob/main/src/features/game/types/salt.ts)
- [Coleta de sal](https://github.com/sunflower-land/sunflower-land/blob/main/src/features/game/events/landExpansion/harvestSalt.ts)
- [Ferramentas e receitas](https://github.com/sunflower-land/sunflower-land/blob/main/src/features/game/types/tools.ts)
- [Restock de NPC](https://github.com/sunflower-land/sunflower-land/blob/main/src/features/game/events/landExpansion/npcRestock.ts)
- [Shipment diário](https://github.com/sunflower-land/sunflower-land/blob/main/src/features/game/events/landExpansion/shipmentRestocked.ts)
- [Yield agrícola](https://github.com/sunflower-land/sunflower-land/blob/main/src/features/game/events/landExpansion/harvest.ts)
- [Community API](https://sunflower-land.com/community-docs/)

## Limites explicitamente expostos

- Preços manuais/históricos; integração automática de marketplace não foi ativada. Não há API key no cliente, Actions ou arquivos públicos.
- Simulação de afeto futuro é determinística e usa o último item ou a média histórica escolhida. Não é uma esperança matemática dos arredondamentos nem uma previsão da sequência aleatória do jogo.
- Rotina de produção é cenário editável; não executa ações no jogo. O sono limita a frequência das aves; Crimstone respeita recuperação; agenda de sal distribui visitas igualmente.
- Crop yield reconhece Old Farmer, Acre Farm, Hectare Farm e Laurie; cobertura de Laurie é manual. Fertilizantes, clima, bônus de equipamento e localização adicionais não são inferidos. Plots-equivalentes não substituem calendário inteiro com colheitas no prazo.
- Curas, doenças, feed alternativo, buffs temporários, buds e combinações de boosts fora das regras implementadas exigem medição/expansão antes de confiar nesses cenários.
- Mineração recursiva usa médias de yield e custos; não limita a produção dos minérios intermediários pelo número de nós nem escalona todas as etapas de fabricação. Portanto, essa rota é uma análise de custo, não garantia de abastecimento no prazo.
- Restock é simulado por dia com demanda agregada e ferramentas prontas. Não há otimização global de horários de clique; sustentabilidade amortiza capacidade consumida e rateia o ferreiro por uso de capacidade.
- Caixa é projeção de venda e compras, não venda realizada. Investimentos e compras do VIP não são misturados ao resultado operacional.
- Uma cotação bruta comum representa o cenário de compra/venda. Floor, bid/ask, volume e preço executado ainda não têm fontes independentes nesta versão.

## Validação

`npm test` executa regressões históricas de setembro/outubro e casos de arredondamento, excedente de XP, 54/31, Pig Onesie, madeira, Crimstone, sal, restock compartilhado, estoque pronto, preço ausente, consolidação, Gems, VIP, ROI e concorrência de pedidos.

Os resultados são confrontos com as regras citadas e fixtures do documento do Rafael. Não houve execução de compra, venda, alimentação ou outras ações na conta do jogo.
