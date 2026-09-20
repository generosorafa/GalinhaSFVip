# Galinha SF VIP

Calculadora econômica focada em **Chicken** para Sunflower Land.

## O que já calcula

- Receita de Eggs e Feathers em 1 / 7 / 28 / 93 dias
- Taxa do Desert e toggle de VIP
- Chonky Feed R1, Efficient Feeding R1, Heartwarming Instruments R1
- Abundant Harvest R1 e Fine Fibers R1
- Mixed Grain necessário
- Comparação: comprar crops no P2P vs produzir com Seeds + Coins
- Warehouse (+20% de stock)
- Laurie the Chuckle Crow + Laurie’s Gains R1 como yield de 1,3 crop/seed (toggle separado; collectible fica OFF por padrão até confirmar que está colocado)
- Restock Betty em Gems
- Pacote de Gems manual (ex.: 75 Gems = 4,82 FLOWER)
- Cash profit vs Economic profit
- Custo de oportunidade de vender os crops
- Plots-equivalentes necessários
- Meta de VIP 3 meses (ex.: 1.500 Gems = 72,39 FLOWER)
- Persistência local via localStorage

## Rodar localmente

Não há dependências. Basta abrir `index.html` no navegador.

Para servir localmente:

```bash
python3 -m http.server 8000
```

Depois acesse `http://localhost:8000`.

## GitHub Pages

1. Crie um repositório novo, por exemplo `galinha-sf-vip`.
2. Envie os arquivos desta pasta para a branch `main`.
3. Em **Settings → Pages**, selecione **Deploy from a branch**.
4. Escolha `main` e `/ (root)`.
5. Salve. O site ficará disponível na URL do GitHub Pages.

## Próximas versões sugeridas

- Integração automática com preços P2P
- Histórico de preços e lucro
- ROI de collectibles (Fat Chicken, Speed Chicken etc.)
- Simulador de sell-now do estoque atual
- Presets de skills e comparador lado a lado
- Exportar/importar cenário em JSON