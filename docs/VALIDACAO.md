# Validação da versão 3

Data: 17/11/2026. Perfil: Farm ID 5782272679195539.

- 29 testes do motor passaram com `npm test`.
- Sintaxe de `app.mjs` e `engine.mjs`: `node --check`, sem erros.
- `git diff --check`: sem erros de whitespace.
- Navegação dos oito módulos conferida no Chrome por título esperado de cada tela.
- Visão geral: 375, 390, 430, 768, 1024, 1366, 1440 e 1920px; sem overflow horizontal da página.
- Todos os oito módulos a 375px; sem overflow da página. Tabelas e menu mantêm rolagem dentro dos próprios contêineres.
- Persistência de preço com vírgula decimal: alteração de Wood para `0,03`, reload imediato e confirmação do mesmo valor. Valor de teste removido depois.
- JSON inválido: mensagem de erro exibida no dialog, sem apagar o cenário válido.
- Importação por texto: um JSON controlado foi aceito; preço manual preservado. Perfil real de referência restaurado depois.
- Seleção automatizada de arquivo ficou condicionada à permissão de arquivo da extensão do Chrome; essa permissão não foi alterada. A alternativa de colar JSON foi testada.
- Tree Blitz: ativar a simulação alterou a produção de 136,80 para 171,00 Wood/dia; desativar restaurou 136,80.
- Entregas: cadastro do pedido de teste e cálculo renderizados. A confirmação síncrona antiga causou bloqueio da ferramenta de navegador; foi substituída por dialog HTML acessível com cancelar/confirmar. Essa última alteração passou na verificação de sintaxe; o fluxo final de remoção ainda requer novo smoke test no navegador.
- Contraste calculado: texto principal/superfície 14,93:1; texto secundário 7,46:1; texto de menor ênfase 5,51:1; botão principal 12,02:1. Borda dos inputs ajustada após a verificação.
- CSS inclui foco visível e regra reduced-motion; não há animação de gráficos ou números. A preferência reduzida não foi emulada pela ferramenta.

Essas verificações validam a implementação e os cenários documentados. Não substituem medição no jogo para bônus não implementados, preços atuais ou capacidade física da cadeia recursiva de mineração.
