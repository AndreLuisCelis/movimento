'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Button,
  Checkbox,
  Column,
  Grid,
  InlineNotification,
  Modal,
  NumberInput,
  Select,
  SelectItem,
  Tag,
  Tile,
  Toggle,
} from '@carbon/react'
import {
  Add,
  ArrowDown,
  ArrowUp,
  CheckmarkFilled,
  ChevronDown,
  ChevronUp,
  Information,
  Notification as NotificationIcon,
  PlayFilledAlt,
  SettingsAdjust,
  Subtract,
  Time,
  TrashCan,
  VolumeUpFilled,
  WarningFilled,
} from '@carbon/icons-react'

type CharacterId = 'captain' | 'doctor' | 'master' | 'random'
type Exercise = { id: number; name: string; quantity: number; unit: string }

type Character = {
  id: Exclude<CharacterId, 'random'>
  name: string
  role: string
  accent: string
  mark: string
  avatar: string
  description: string
  introduction: string
  encouragement: string
  alerts: string[]
  completions: string[]
}

const characters: Character[] = [
  { id: 'captain', name: 'Capitão Augusto', role: 'coragem e movimento', accent: 'captain', mark: 'C', avatar: '/avatars/capitao.png', description: 'Coragem para começar e energia para continuar.', introduction: 'Sou o Capitão Augusto. Pode contar comigo para transformar cada pausa em uma missão possível. Vou incentivar você com coragem, bom humor e espírito de equipe — sem deixar ninguém para trás.', encouragement: 'Recruta, atenção! Seu corpo não pede uma batalha impossível, pede apenas uma decisão corajosa. Levante-se comigo, faça o que estiver ao seu alcance e celebre cada movimento. Um passo de cada vez também é avanço — e nesta equipe, ninguém fica para trás!', alerts: ['Atenção, comandante! Chegou a hora de sair da cadeira. Levante-se com firmeza, cumpra sua bateria de movimentos e mostre ao seu corpo que você ainda está no comando.', 'Comandante, nenhuma grande mudança começa sem o primeiro passo. Levante-se agora, faça estes poucos movimentos com presença e volte para sua missão ainda mais forte.', 'Ouça a ordem: movimento! Esta é uma missão rápida, segura e importante. Erga-se, complete sua bateria e avance sabendo que cada repetição fortalece o seu dia.'], completions: ['Muito bem, comandante! Missão cumprida.', 'Excelente trabalho. Agora você pode voltar ainda mais forte.'] },
  { id: 'doctor', name: 'Dra. Lia', role: 'ciência e cuidado', accent: 'doctor', mark: 'D', avatar: '/avatars/doutor.png', description: 'Informação clara para cuidar melhor de si.', introduction: 'Sou a Dra. Lia. Vou compartilhar dicas de saúde, alimentação e ciência em uma linguagem simples, para você entender seu corpo e cuidar dele com segurança e leveza.', encouragement: 'Uma pausa ativa é um cuidado pequeno com efeitos importantes: ajuda a variar a postura, estimula a circulação e recupera sua energia. Não precisa fazer tudo de uma vez. Escolha um movimento confortável, observe como seu corpo responde e avance com segurança.', alerts: ['Seu corpo precisa de movimento. Vamos fazer uma pequena pausa ativa.', 'Uma pausa curta ajuda a quebrar longos períodos sentado.', 'Movimente-se com calma e atenção ao seu corpo.'], completions: ['Muito bem. Uma pequena pausa já fez diferença para o seu dia.', 'Pausa concluída. Continue ouvindo os sinais do seu corpo.'] },
  { id: 'master', name: 'Mestre Bento', role: 'presença e equilíbrio', accent: 'master', mark: 'M', avatar: '/avatars/mestre.png', description: 'Calma, presença e sabedoria para o caminho.', introduction: 'Sou o Mestre Bento. Estarei ao seu lado com escuta, serenidade e bons conselhos. Juntos, vamos cultivar constância sem pressa e fortalecer a mente com gentileza.', encouragement: 'Meu amigo, não transforme o cuidado em cobrança. Respire, escute o corpo e permita-se começar do ponto em que está. A constância não nasce de grandes promessas, mas de pequenos gestos repetidos com presença e gentileza.', alerts: ['A próxima decisão é simples: continuar sentado ou escolher se mover.', 'A disciplina se constrói nas pequenas escolhas.', 'Levantar agora é uma pequena vitória contra a inércia.'], completions: ['A disciplina apareceu na sua escolha. Muito bem.', 'Mais uma pequena vitória. O caminho é feito de passos assim.'] },
]

const initialExercises: Exercise[] = [
  { id: 1, name: 'Agachamentos', quantity: 10, unit: 'repetições' },
  { id: 2, name: 'Flexões', quantity: 10, unit: 'repetições' },
  { id: 3, name: 'Panturrilhas', quantity: 15, unit: 'repetições' },
  { id: 4, name: 'Mobilidade', quantity: 10, unit: 'movimentos' },
]

const STORAGE_KEY = 'movimento-settings-v1'
const formatTime = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)]

export function MovimentoApp() {
  const [intervalMinutes, setIntervalMinutes] = useState(60)
  const [snoozeMinutes, setSnoozeMinutes] = useState(5)
  const [characterId, setCharacterId] = useState<CharacterId>('captain')
  const [exercises, setExercises] = useState(initialExercises)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [endTime, setEndTime] = useState(() => Date.now() + 60 * 60 * 1000)
  const [remaining, setRemaining] = useState(60 * 60)
  const [alertOpen, setAlertOpen] = useState(false)
  const [presentationCharacter, setPresentationCharacter] = useState<Character | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [completed, setCompleted] = useState(5)
  const [lastMovement, setLastMovement] = useState('14:32')
  const [notice, setNotice] = useState('')
  const [alertMessage, setAlertMessage] = useState(characters[0].alerts[0])
  const audioContext = useRef<AudioContext | null>(null)

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
      if (stored) {
        if (stored.intervalMinutes) setIntervalMinutes(stored.intervalMinutes)
        if (stored.snoozeMinutes) setSnoozeMinutes(stored.snoozeMinutes)
        if (stored.characterId) setCharacterId(stored.characterId)
        if (stored.exercises) setExercises(stored.exercises)
        if (typeof stored.soundEnabled === 'boolean') setSoundEnabled(stored.soundEnabled)
        if (stored.endTime) setEndTime(stored.endTime)
      }
    } catch { /* keep defaults when storage is unavailable */ }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ intervalMinutes, snoozeMinutes, characterId, exercises, soundEnabled, endTime }))
  }, [intervalMinutes, snoozeMinutes, characterId, exercises, soundEnabled, endTime])

  const currentCharacter = useMemo(() => characterId === 'random' ? pick(characters) : characters.find((character) => character.id === characterId)!, [characterId, alertOpen])
  const nextAlert = new Date(endTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const playAlert = useCallback(() => {
    if (!soundEnabled) return
    const context = audioContext.current || new AudioContext()
    audioContext.current = context
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.frequency.value = 660
    oscillator.type = 'sine'
    gain.gain.setValueAtTime(0.001, context.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.45)
    oscillator.connect(gain).connect(context.destination)
    oscillator.start()
    oscillator.stop(context.currentTime + 0.45)
  }, [soundEnabled])

  const notify = useCallback(() => {
    if (notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') new Notification('Hora de se mexer!', { body: `${currentCharacter.name}: sua missão começou.` })
  }, [currentCharacter.name, notificationsEnabled])

  const triggerAlert = useCallback(() => {
    const nextCharacter = pick(characters)
    setCharacterId(nextCharacter.id)
    setAlertMessage(pick(nextCharacter.alerts))
    setAlertOpen(true)
    playAlert()
    notify()
  }, [currentCharacter, notify, playAlert])

  useEffect(() => {
    const tick = () => {
      const seconds = Math.max(0, Math.ceil((endTime - Date.now()) / 1000))
      setRemaining(seconds)
      if (seconds === 0 && !alertOpen) triggerAlert()
    }
    tick()
    const timer = window.setInterval(tick, 1000)
    return () => window.clearInterval(timer)
  }, [alertOpen, endTime, triggerAlert])

  const resetTimer = (minutes = intervalMinutes) => setEndTime(Date.now() + minutes * 60 * 1000)
  const snooze = () => { setAlertOpen(false); resetTimer(snoozeMinutes) }
  const skip = () => { setAlertOpen(false); resetTimer() }
  const complete = () => { setAlertOpen(false); setCompleted((value) => Math.min(value + 1, 6)); setLastMovement(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })); resetTimer() }
  const addExercise = () => setExercises((items) => [...items, { id: Date.now(), name: 'Novo exercício', quantity: 10, unit: 'repetições' }])
  const updateExercise = (id: number, field: keyof Exercise, value: string | number) => setExercises((items) => items.map((item) => item.id === id ? { ...item, [field]: value } : item))
  const moveExercise = (index: number, direction: -1 | 1) => setExercises((items) => { const next = [...items]; const target = index + direction; if (target < 0 || target >= next.length) return items; [next[index], next[target]] = [next[target], next[index]]; return next })
  const requestNotifications = async () => { if (!('Notification' in window)) return setNotice('Seu navegador não oferece notificações.') ; const permission = await Notification.requestPermission(); setNotificationsEnabled(permission === 'granted'); setNotice(permission === 'granted' ? 'Notificações ativadas.' : 'Notificações bloqueadas pelo navegador.') }

  return (
    <div className="movimento-app">
      <section className="movement-hero">
        <Grid>
          <Column sm={4} md={8} lg={10} xlg={10}>
            <div className="eyebrow"><span className="eyebrow-dot" /> COMPANHEIRO DE MOVIMENTO</div>
            <h1>Movimento</h1>
            <p>Seu lembrete gentil — e insistente — para sair da cadeira durante o dia.</p>
          </Column>
          <Column sm={4} md={8} lg={6} xlg={6} className="hero-status">
            <Tag type="cool-gray"><Time size={16} /> rotina ativa</Tag>
            <span className="hero-status-copy">Seg a Sex · 08:00 — 18:00</span>
          </Column>
        </Grid>
      </section>

      <main className="movement-content">
        <Grid>
          <Column sm={4} md={8} lg={10} xlg={10}>
            <div className="section-heading"><div><span className="eyebrow">PRÓXIMO MOVIMENTO</span><h2>{formatTime(remaining)}</h2><p>Próximo aviso: <strong>{nextAlert}</strong></p></div><div className="character-avatar recruit"><img src="/avatars/recruta.png" alt="Avatar do recruta" /></div></div>
            <Tile className="next-movement-card">
              <div className="routine-list"><div className="card-topline"><span>SUA BATERIA</span><span>{exercises.length} exercícios</span></div>{exercises.map((exercise) => <div className="routine-item" key={exercise.id}><span>{exercise.name}</span><strong>{exercise.quantity} <small>{exercise.unit}</small></strong></div>)}</div>
              <div className="primary-actions"><Button renderIcon={PlayFilledAlt} onClick={triggerAlert}>Iniciar rotina</Button><Button kind="ghost" renderIcon={SettingsAdjust} onClick={() => setSettingsOpen(true)}>Configurações</Button></div>
            </Tile>
          </Column>
          <Column sm={4} md={8} lg={6} xlg={6}>
            <div className="side-heading"><span className="eyebrow">HOJE</span><span className="date-label">28 SET 2026</span></div>
            <div className="stats-grid"><Tile><span className="stat-value">6</span><span className="stat-label">movimentos hoje</span></Tile><Tile><span className="stat-value stat-time">{lastMovement}</span><span className="stat-label">último movimento</span></Tile></div>
            <Tile className="progress-card"><div className="card-topline"><span>BATERIAS CONCLUÍDAS</span><strong>{completed} / 6</strong></div><div className="progress-track"><span style={{ width: `${(completed / 6) * 100}%` }} /></div><p>Mais uma pausa e você fecha o ciclo do dia.</p></Tile>
            <Tile className="quiet-card"><Information size={20} /><div><strong>Pequenas pausas contam.</strong><p>O Movimento não é um treino. É um convite para interromper a inércia.</p></div></Tile>
          </Column>
        </Grid>
      </main>

      <section className="characters-overview" aria-labelledby="characters-title"><Grid><Column sm={4} md={8} lg={16} xlg={16}><div className="overview-heading"><div><span className="eyebrow">SEUS COMPANHEIROS</span><h2 id="characters-title">Quem vai falar com você?</h2></div><p>Conheça quem vai estar ao seu lado durante as pausas do dia.</p></div><div className="character-cards">{characters.map((character) => <Tile className={`character-card ${character.accent}`} key={character.id} role="button" tabIndex={0} onClick={() => setPresentationCharacter(character)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setPresentationCharacter(character) } }}><div className="character-card-avatar"><img src={character.avatar} alt={`Avatar do ${character.name}`} /></div><div className="character-card-copy"><span className="eyebrow">{character.role}</span><h3>{character.name}</h3><p>{character.description}</p><span className="card-action">Conhecer personagem <ChevronDown size={16} /></span></div></Tile>)}</div></Column></Grid></section>

      <Modal open={presentationCharacter !== null} onRequestClose={() => setPresentationCharacter(null)} passiveModal className="presentation-modal" modalHeading={presentationCharacter ? `Olá, eu sou o ${presentationCharacter.name}` : ''}><div className={presentationCharacter ? `presentation-content ${presentationCharacter.accent}` : 'presentation-content'}>{presentationCharacter && <><div className="presentation-avatar"><img src={presentationCharacter.avatar} alt={`Avatar do ${presentationCharacter.name}`} /></div><span className="eyebrow">{presentationCharacter.role}</span><p className="presentation-introduction">{presentationCharacter.introduction}</p><div className="presentation-details"><h3>Como posso ajudar</h3><p>{presentationCharacter.id === 'captain' ? 'Vou acompanhar suas pausas com energia, incentivo e pequenas missões práticas. Quando você precisar de coragem para começar, estarei aqui para lembrar que consistência vale mais do que perfeição.' : presentationCharacter.id === 'doctor' ? 'Vou compartilhar informações simples sobre movimento, descanso, alimentação e bem-estar. Meu objetivo é ajudar você a tomar decisões conscientes, respeitando seus limites e o que seu corpo comunica.' : 'Vou ajudar você a construir uma relação mais gentil com a rotina. Nas pausas difíceis, trarei presença, reflexão e conselhos para que você continue avançando sem transformar o cuidado em cobrança.'}</p></div><div className="presentation-message"><span className="eyebrow">UMA PALAVRA PARA VOCÊ</span><p>{presentationCharacter.encouragement}</p></div><Button kind="primary" onClick={() => { setCharacterId(presentationCharacter.id); setPresentationCharacter(null) }}>Usar nos lembretes</Button></>}</div></Modal>

      <Modal open={alertOpen} onRequestClose={skip} passiveModal className="alert-modal" modalHeading="Hora de se mexer!" primaryButtonText="Começar" secondaryButtonText={`Adiar ${snoozeMinutes} min`} onRequestSubmit={complete} onSecondarySubmit={snooze}>
        <div className={`alert-character ${currentCharacter.accent}`}><div className="character-avatar large"><img src={currentCharacter.avatar} alt={`Avatar do ${currentCharacter.name}`} /></div><div className="character-message"><span className="eyebrow">{currentCharacter.name.toUpperCase()} · {currentCharacter.role}</span><div className="speech-bubble"><p>{alertMessage}</p></div></div></div>
        <h2>É HORA DE SE MEXER!</h2><p className="alert-subtitle">Levante por alguns minutos. Seu corpo estava esperando por este momento.</p>
        <div className="mission-box"><span className="eyebrow">SUA MISSÃO</span>{exercises.map((exercise) => <div className="mission-item" key={exercise.id}><CheckmarkFilled size={20} /><span>{exercise.quantity} {exercise.name.toLowerCase()}</span></div>)}</div>
        <Button kind="danger--tertiary" onClick={skip}>Ignorar esta pausa</Button>
      </Modal>

      <Modal open={settingsOpen} onRequestClose={() => setSettingsOpen(false)} modalHeading="Configurar rotina" primaryButtonText="Salvar e fechar" onRequestSubmit={() => setSettingsOpen(false)} size="md">
        <div className="settings-stack"><div className="settings-section"><h3>Intervalo entre movimentos</h3><div className="preset-row">{[30, 45, 60, 90, 120].map((value) => <Button key={value} kind={intervalMinutes === value ? 'primary' : 'tertiary'} size="sm" onClick={() => { setIntervalMinutes(value); resetTimer(value) }}>{value} min</Button>)}</div><NumberInput id="custom-interval" label="Intervalo personalizado (minutos)" min={1} max={240} value={intervalMinutes} onChange={(_, { value }) => { const next = Number(value) || 1; setIntervalMinutes(next); resetTimer(next) }} /></div><div className="settings-section"><h3>Sua bateria</h3>{exercises.map((exercise, index) => <div className="exercise-editor" key={exercise.id}><NumberInput className="quantity-input" id={`quantity-${exercise.id}`} hideLabel label="Quantidade" min={1} value={exercise.quantity} onChange={(_, { value }) => updateExercise(exercise.id, 'quantity', Number(value) || 1)} /><input aria-label="Nome do exercício" value={exercise.name} onChange={(event) => updateExercise(exercise.id, 'name', event.target.value)} /><Select id={`unit-${exercise.id}`} labelText="Unidade" hideLabel value={exercise.unit} onChange={(event) => updateExercise(exercise.id, 'unit', event.target.value)}><SelectItem value="repetições" text="repetições" /><SelectItem value="segundos" text="segundos" /><SelectItem value="minutos" text="minutos" /><SelectItem value="movimentos" text="movimentos" /></Select><Button hasIconOnly kind="ghost" renderIcon={ArrowUp} iconDescription="Mover para cima" disabled={index === 0} onClick={() => moveExercise(index, -1)} /><Button hasIconOnly kind="ghost" renderIcon={ArrowDown} iconDescription="Mover para baixo" disabled={index === exercises.length - 1} onClick={() => moveExercise(index, 1)} /><Button className="delete-exercise" hasIconOnly kind="danger--tertiary" renderIcon={TrashCan} iconDescription="Excluir exercício" tooltipPosition="bottom" onClick={() => setExercises((items) => items.filter((item) => item.id !== exercise.id))} /></div>)}<Button kind="tertiary" renderIcon={Add} onClick={addExercise}>Adicionar exercício</Button></div><div className="settings-section"><h3>Preferências</h3><Toggle id="sound-toggle" labelText="Sons" labelA="Desligado" labelB="Ligado" toggled={soundEnabled} onToggle={setSoundEnabled} /><Button kind="tertiary" renderIcon={NotificationIcon} onClick={requestNotifications}>Ativar notificações</Button>{notice && <InlineNotification lowContrast kind="info" title={notice} onCloseButtonClick={() => setNotice('')} />}</div></div>
      </Modal>
    </div>
  )
}
