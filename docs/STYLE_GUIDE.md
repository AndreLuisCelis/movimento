# Movimento — Style Guide

## Objetivo

O Movimento transforma pausas do dia em ações simples de movimento, saúde e autocuidado. A interface deve transmitir acolhimento, clareza e incentivo sem parecer infantil ou barulhenta.

## Princípios

- **Clareza antes de decoração:** uma ação principal por bloco.
- **Incentivo sem cobrança:** linguagem positiva, direta e humana.
- **Neutro como base:** fundos claros, bordas sutis e contraste consistente.
- **Personalidade com propósito:** Capitão Augusto, Dra. Lia e Mestre Bento têm vozes diferentes, mas todos são amigáveis.
- **Acessibilidade por padrão:** foco visível, labels acessíveis, texto legível e suporte a teclado.

## Sistema visual

O projeto usa **Carbon Design System** com `@carbon/react` e `@carbon/icons-react`.

### Cores

Nunca use hex, RGB ou cores inventadas nos componentes. Use tokens Carbon:

- Fundo: `var(--cds-background)`
- Camada: `var(--cds-layer-01)` e `var(--cds-layer-02)`
- Texto: `var(--cds-text-primary)` e `var(--cds-text-secondary)`
- Bordas: `var(--cds-border-subtle-01)` e `var(--cds-border-strong-01)`
- Ação: `var(--cds-link-primary)`
- Sucesso/erro/apoio: tokens `var(--cds-support-*)`

A maior parte da tela deve permanecer neutra. Cor de personagem é apenas um acento pequeno, nunca um fundo atrás de texto longo.

### Tipografia

Use IBM Plex por meio dos estilos Carbon em Sass:

```scss
@use '@carbon/react/scss/type' as type;

.title { @include type.type-style('heading-compact-02'); }
.copy { @include type.type-style('body-01'); }
.meta { @include type.type-style('label-01'); }
```

Não crie tamanhos arbitrários. Use `text-balance`/`text-pretty` quando aplicável no JSX.

### Espaçamento e layout

Use tokens Carbon (`spacing.$spacing-03`, `spacing.$spacing-05`, etc.) e `Grid`/`Column` para estrutura responsiva. Prefira flexbox; use grid apenas para relações bidimensionais, como o editor de exercícios.

Breakpoints de referência: `sm` 320px, `md` 672px, `lg` 1056px. Todo `Column` deve declarar spans relevantes.

## Componentes e interação

- Use componentes Carbon para botões, modais, tiles, inputs, selects, tags e feedback.
- Use ícones oficiais de `@carbon/icons-react`; não desenhe SVG manual.
- Hover deve reforçar estado com sombra, fundo ou borda. Não mova cards.
- Modais devem ter título claro, conteúdo com contraste e fechamento acessível.
- Inputs numéricos devem separar visualmente valor e controles de incremento.
- A exclusão deve usar ação destrutiva explícita, ícone `TrashCan` e descrição acessível.

## Personagens

- **Capitão Augusto — coragem e movimento:** fala como um capitão experiente, firme, caloroso e encorajador. Usa linguagem de equipe, nunca ameaça ou culpa.
- **Dra. Lia — ciência e cuidado:** explica saúde, alimentação e movimento com dados compreensíveis, cautela e respeito aos limites individuais. Não faz diagnóstico.
- **Mestre Bento — presença e equilíbrio:** aconselha com serenidade, gentileza e foco em constância. Evita perfeccionismo e cobrança.

Os personagens não são escolhidos na configuração da rotina. A cada novo início, um é sorteado para conduzir o aviso.

## Conteúdo

Use frases curtas para ações e textos mais completos nos modais de apresentação. Fale no português brasileiro, com tom amigável e inclusivo. Evite jargão militar excessivo, promessas médicas e linguagem de culpa.

## Checklist

- [ ] Usa tokens Carbon, sem cores cruas.
- [ ] Usa componentes e ícones públicos Carbon.
- [ ] Mantém contraste e foco de teclado.
- [ ] Não usa movimento no hover de cards.
- [ ] Mantém responsividade em 320px, 672px e 1056px+.
- [ ] Valida `pnpm build` depois de mudanças relevantes.
- [ ] Verifica comportamento visível no preview.
