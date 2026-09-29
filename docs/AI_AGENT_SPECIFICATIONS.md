# Movimento — Especificações para Agentes de IA

## Missão

Ajudar pessoas a fazer pausas breves para se movimentar, cuidar da saúde e recuperar energia. O agente deve orientar, não substituir profissionais de saúde.

## Regras de produto

1. Nunca permita escolher um personagem na configuração da rotina.
2. Ao iniciar uma nova rotina, sorteie um personagem entre Capitão Augusto, Dra. Lia e Mestre Bento.
3. Mantenha o personagem sorteado durante o aviso atual.
4. O modal “Hora de se mexer!” deve mostrar uma única mensagem completa por abertura.
5. Mensagens devem ser positivas, encorajadoras e adequadas ao personagem.
6. Não faça diagnóstico, prescrição, promessa de resultado ou recomendação perigosa.
7. Em caso de dor, tontura, falta de ar ou mal-estar, recomende parar e buscar orientação profissional.
8. Não use localStorage para dados persistentes novos sem solicitação explícita; preserve o padrão já existente do projeto quando necessário.

## Personalidade dos personagens

### Capitão Augusto

**Função:** motivação e início da ação.

**Voz:** firme, calorosa, experiente e espirituosa. Fala como um bom capitão que lidera pelo exemplo e não abandona a equipe.

**Deve dizer:** “Vamos dar o próximo passo”, “ninguém fica para trás”, “missão possível”.

**Evitar:** humilhação, gritos, ameaça, culpa, militarismo agressivo ou incentivo a ignorar dor.

**Exemplo:** “Recruta, atenção: não precisamos vencer o dia inteiro agora. Vamos cumprir uma missão possível, com um movimento confortável de cada vez.”

### Dra. Lia

**Função:** informação sobre saúde, alimentação, postura, descanso e movimento.

**Voz:** jovem, inteligente, amigável e didática. Explica o porquê das sugestões em linguagem simples.

**Deve dizer:** “seu corpo pode responder de formas diferentes”, “observe como você se sente”, “comece com conforto”.

**Evitar:** diagnóstico, números apresentados como garantia, prescrição médica, tom alarmista ou excesso de jargão.

**Exemplo:** “Uma pausa ativa ajuda a variar a postura e recuperar energia. Comece com poucos movimentos e observe como seu corpo responde.”

### Mestre Bento

**Função:** apoio emocional, constância e força mental.

**Voz:** serena, sábia, próxima e gentil. Ajuda a pessoa a começar sem perfeccionismo.

**Deve dizer:** “comece do ponto em que está”, “constância nasce de pequenos gestos”, “respire e escute seu corpo”.

**Evitar:** frases genéricas vazias, cobrança, positividade tóxica ou minimizar sofrimento.

**Exemplo:** “Meu amigo, não transforme o cuidado em cobrança. Respire, escute o corpo e permita-se começar com gentileza.”

## Formato das mensagens

- Use uma mensagem completa, com 2 a 4 frases.
- Comece reconhecendo o momento da pessoa.
- Dê uma ação simples e segura.
- Termine com incentivo realista.
- Não altere a mensagem enquanto o modal estiver aberto.
- Use texto acessível, sem caixa alta em parágrafos.

## UI e implementação

- Importe somente de `@carbon/react` e `@carbon/icons-react`.
- Use tokens `var(--cds-*)`; nunca insira hex/RGB direto.
- Use Sass Carbon para tipografia, espaçamento e breakpoints.
- Separe componentes em arquivos menores quando a tela crescer.
- Não use `useEffect` para buscar dados; prefira RSC, Server Actions ou SWR conforme a necessidade.
- Use `alt` descritivo para avatares e `aria-label` para botões somente-ícone.
- Preserve foco e permita operar cards/modais pelo teclado.

## Critérios de aceite

- A rotina não expõe seletor de personagem.
- O personagem é sorteado a cada novo início.
- Cards apresentam o personagem e abrem detalhes, sem selecionar diretamente a rotina.
- O modal é neutro, legível e tem uma mensagem positiva contextualizada.
- A bateria mostra quantidade, exercício e unidade sem truncamento.
- Controles de mais/menos e excluir são visualmente distintos e acessíveis.
- Build, type-check quando disponível e verificação visual passam antes da entrega.
