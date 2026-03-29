import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';

const { width, height } = Dimensions.get('window');

const PIXEL = 6;
const PLAYER_WIDTH = 42;

const ENEMY_SHAPE = [
  [0,1,0,1,0],
  [1,1,1,1,1],
  [1,0,1,0,1],
];

const PLAYER_SHAPE = [
  [0,0,1,0,0,0,1,0,0],
  [0,1,1,1,1,1,1,1,0],
  [1,1,0,1,1,1,0,1,1],
  [0,0,0,1,1,1,0,0,0],
  [0,0,1,0,1,0,1,0,0],
];


const BOSS_SHAPE = [
  [0,0,1,1,1,1,1,0,0],
  [0,1,1,1,1,1,1,1,0],
  [1,1,0,1,1,1,0,1,1],
  [1,1,1,1,0,1,1,1,1],
  [0,1,1,1,1,1,1,1,0],
  [0,0,1,0,1,0,1,0,0],
];


const SUPER_BOSS_SHAPE = [
  [0,0,1,1,1,1,1,1,1,0,0],
  [0,1,1,1,1,1,1,1,1,1,0],
  [1,1,0,1,1,1,1,1,0,1,1],
  [1,1,1,1,0,1,1,0,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1],
  [0,1,1,0,1,0,1,0,1,1,0],
  [0,0,1,0,0,1,0,0,1,0,0],
];



const COLORS = ['lime', 'cyan', 'magenta', 'orange', 'yellow', 'red'];
const POWER_TYPES = [
  { tipo: 'tiempo', color: 'red' },
  { tipo: 'autoDisparo', color: 'blue' },
  { tipo: 'escudo', color: 'green' }
];

function PixelShip({ x, y, shape, color }) {
  return (
    <View style={{ position: 'absolute', left: x, top: y }}>
      {shape.map((row, i) => (
        <View key={i} style={{ flexDirection: 'row' }}>
          {row.map((cell, j) => (
            cell ? <View key={j} style={{ width: PIXEL, height: PIXEL, backgroundColor: color }} /> : <View key={j} style={{ width: PIXEL, height: PIXEL }} />
          ))}
        </View>
      ))}
    </View>
  );
}

function Explosion({ x, y }) {
  return (
    <View style={{ position: 'absolute', left: x, top: y }}>
      {[...Array(16)].map((_, i) => (
        <View key={i} style={{ width: PIXEL, height: PIXEL, backgroundColor: 'orange', margin: 1 }} />
      ))}
    </View>
  );
}

export default function App() {
  const [level, setLevel] = useState(1);
  const [playerX, setPlayerX] = useState(width / 2 - PLAYER_WIDTH / 2);
  const [playerBullets, setPlayerBullets] = useState([]);
  const [enemyBullets, setEnemyBullets] = useState([]);
  const [explosion, setExplosion] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [win, setWin] = useState(false);
  const [powers, setPowers] = useState([]);
  const [destroyedCount, setDestroyedCount] = useState(0);

  const [timeStopped, setTimeStopped] = useState(false);
  const [autoShooting, setAutoShooting] = useState(false);
  const [shieldActive, setShieldActive] = useState(false);

  const autoShootInterval = useRef(null);

  const enemyColor = COLORS[level % COLORS.length];

 const createEnemies = (lvl) => {
  const speed = 1 + lvl * 0.05;

  // 🟥 SUPER JEFE cada 10 niveles
  if (lvl % 10 === 0) {
    return [{
      id: 'superboss',
      x: width / 2 - 80,
      y: 60,
      dx: 2,
      dy: 0,
      hp: 60,
      boss: true,
      super: true,
      shootCooldown: 10,
    }];
  }

  // 🟧 JEFE cada 3 niveles
  if (lvl % 3 === 0) {
    return [{
      id: 'boss',
      x: width / 2 - 60,
      y: 60,
      dx: 2,
      dy: 0,
      hp: 25,
      boss: true,
      super: false,
      shootCooldown: 20,
    }];
  }

  // 👾 enemigos normales
  return Array.from({ length: lvl + 3 }).map((_, i) => ({
    id: i + Math.random(),
    x: Math.random() * (width - 40),
    y: 40 + Math.random() * 120,
    dx: (Math.random() > 0.5 ? 1 : -1) * speed,
    dy: (Math.random() > 0.5 ? 1 : -1) * speed * 0.4,
    shootCooldown: Math.max(20, 80 - lvl),
    hp: 1,
    boss: false,
  }));
};


  const [enemies, setEnemies] = useState(createEnemies(1));

  const lose = (x, y) => {
    if (shieldActive) return; // escudo protege
    setExplosion({ x, y });
    setGameOver(true);
  };

  const resetAfterLose = () => {
    setLevel(l => (l === 1 ? 1 : l - 1));
    setEnemies(createEnemies(level));
    setPlayerBullets([]);
    setEnemyBullets([]);
    setExplosion(null);
    setGameOver(false);
    setWin(false);
    setPowers([]);
    setDestroyedCount(0);
    setTimeStopped(false);
    setAutoShooting(false);
    setShieldActive(false);
    if (autoShootInterval.current) clearInterval(autoShootInterval.current);
  };

 const shoot = () => {
  if (gameOver || win) return;

  setPlayerBullets(bullets => {
    const centerX = playerX + PLAYER_WIDTH / 2;

    return [
      ...bullets,
      { x: centerX - 8, y: height - 100 },
      { x: centerX,     y: height - 100 },
      { x: centerX + 8, y: height - 100 },
    ];
  });
};


  useEffect(() => {
    if (autoShooting && !gameOver && !win) {
      if (autoShootInterval.current) clearInterval(autoShootInterval.current);
      autoShootInterval.current = setInterval(shoot, 150);
      setTimeout(() => {
        setAutoShooting(false);
        clearInterval(autoShootInterval.current);
      }, 5000);
    }
  }, [autoShooting, gameOver, win]);

  useEffect(() => {
    if (gameOver || win) return;

    const loop = setInterval(() => {
      // Mover enemigos si el tiempo no está detenido
      if (!timeStopped) {
  setEnemies(prev => prev.map(e => {
    let nx = e.x + e.dx;
    let ny = e.y + (e.boss ? 0 : e.dy);

    const enemyWidth = e.super ? 90 : e.boss ? 70 : 30;

    if (nx <= 0 || nx >= width - enemyWidth) {
      e.dx *= -1;
    }

    if (!e.boss) {
      if (ny <= 0 || ny >= height - 200) e.dy *= -1;
      if (ny > height - 150) lose(e.x, e.y);
    }

    if (e.shootCooldown <= 0) {
      setEnemyBullets(b => [
        ...b,
        { x: e.x + enemyWidth / 2, y: e.y + 20 }
      ]);
      e.shootCooldown = Math.max(20, 80 - level);
    } else {
      e.shootCooldown--;
    }

    return { ...e, x: nx, y: ny };
  }));
}


      // Mover balas
      setPlayerBullets(b => b.map(bu => ({ ...bu, y: bu.y - 18 })).filter(bu => bu.y > 0));
      if (!timeStopped) setEnemyBullets(b => b.map(bu => ({ ...bu, y: bu.y + 8 })).filter(bu => bu.y < height));

      // Colisión balas con enemigos
      setEnemies(prev => {
  let destroyedThisFrame = 0;

  const updatedEnemies = prev.map(e => {
    const enemyWidth = e.super ? 90 : e.boss ? 70 : 30;
    const enemyHeight = e.super ? 40 : e.boss ? 35 : 20;

    const hit = playerBullets.some(b =>
      b.x > e.x &&
      b.x < e.x + enemyWidth &&
      b.y > e.y &&
      b.y < e.y + enemyHeight
    );

    if (hit) {
      if (e.hp > 1) {
        return { ...e, hp: e.hp - 1 };
      } else {
        destroyedThisFrame++;
        return null; // enemigo destruido
      }
    }

    return e;
  }).filter(Boolean);

  if (destroyedThisFrame > 0) {
    setDestroyedCount(c => {
      const total = c + destroyedThisFrame;
      if (total >= 3) {
        const power = POWER_TYPES[Math.floor(Math.random() * POWER_TYPES.length)];
        setPowers(p => [
          ...p,
          {
            x: Math.random() * (width - 30),
            y: 50,
            color: power.color,
            tipo: power.tipo,
          },
        ]);
        return total - 3;
      }
      return total;
    });
  }

  return updatedEnemies;
});

      // Mover poderes
      setPowers(prev => prev.map(p => ({ ...p, y: p.y + 4 })).filter(p => p.y < height));

      // Detectar colisión jugador con poderes
      powers.forEach(p => {
        if (p.x + 20 > playerX && p.x < playerX + PLAYER_WIDTH && p.y + 20 > height - 100 && p.y < height - 100 + 40) {
          // aplicar poder
          if (p.tipo === 'tiempo') {
            setTimeStopped(true);
            setTimeout(() => setTimeStopped(false), 3000);
          } else if (p.tipo === 'autoDisparo') {
            setAutoShooting(true);
          } else if (p.tipo === 'escudo') {
            setShieldActive(true);
            setTimeout(() => setShieldActive(false), 5000);
          }
          setPowers(pw => pw.filter(x => x !== p));
        }
      });

      // Colisión balas enemigas con jugador
      enemyBullets.forEach(b => {
        if (b.x > playerX && b.x < playerX + PLAYER_WIDTH && b.y > height - 80) {
          lose(playerX, height - 80);
        }
      });

    }, 30);

    return () => clearInterval(loop);
  }, [playerBullets, enemyBullets, gameOver, win, powers, playerX, timeStopped, autoShooting, shieldActive]);

  useEffect(() => {
    if (enemies.length === 0 && !gameOver) {
      setWin(true);
      setTimeout(() => {
        setWin(false);
        setLevel(l => Math.min(100, l + 1));
        setEnemies(createEnemies(Math.min(100, level + 1)));
      }, 1200);
    }
  }, [enemies]);

  return (
    <View style={styles.container}>
      <Text style={styles.level}>Nivel {level} / 100</Text>

     {enemies.map(e => (
  <PixelShip
    key={e.id}
    x={e.x}
    y={e.y}
    shape={e.super ? SUPER_BOSS_SHAPE : e.boss ? BOSS_SHAPE : ENEMY_SHAPE}
    color={e.super ? 'red' : e.boss ? 'orange' : enemyColor}
  />
))}


      {!gameOver && (
  <>
    {shieldActive && (
      <View
        style={[
          styles.shield,
          {
            left: playerX - 12,
            top: height - 112,
          },
        ]}
      />
    )}
    <PixelShip
      x={playerX}
      y={height - 100}
      shape={PLAYER_SHAPE}
      color="#00eaff"
    />
  </>
)}


      {playerBullets.map((b, i) => <View key={i} style={[styles.bullet, { left: b.x, top: b.y }]} />)}
      {enemyBullets.map((b, i) => <View key={i} style={[styles.enemyBullet, { left: b.x, top: b.y }]} />)}

      {powers.map((p, i) => (
        <View key={i} style={{ position: 'absolute', left: p.x, top: p.y, width: 20, height: 20, backgroundColor: p.color, borderRadius: 4 }} />
      ))}

      {explosion && <Explosion x={explosion.x} y={explosion.y} />}

      {gameOver && (
        <View style={styles.center}>
          <Text style={styles.msg}>💀 PERDISTE</Text>
          <TouchableOpacity onPress={resetAfterLose} style={styles.restart}><Text style={styles.restartText}>CONTINUAR</Text></TouchableOpacity>
        </View>
      )}

      {win && <Text style={styles.msg}>🎉 NIVEL SUPERADO</Text>}

      <View style={styles.controls}>
        <TouchableOpacity onPress={() => setPlayerX(x => Math.max(0, x - 30))}><Text style={styles.btn}>◀</Text></TouchableOpacity>
        <TouchableOpacity onPress={shoot}><Text style={styles.btn}>🔥</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setPlayerX(x => Math.min(width - PLAYER_WIDTH, x + 30))}><Text style={styles.btn}>▶</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  bullet: { position: 'absolute', width: 4, height: 10, backgroundColor: 'red' },
  enemyBullet: { position: 'absolute', width: 4, height: 10, backgroundColor: 'yellow' },
  controls: { position: 'absolute', bottom: 0, width: '100%', flexDirection: 'row', justifyContent: 'space-around', padding: 20 },
  btn: { color: 'white', fontSize: 30 },
  msg: { color: 'white', fontSize: 28, textAlign: 'center' },
  level: { color: 'white', padding: 10 },
  center: { position: 'absolute', top: height / 2 - 60, width: '100%', alignItems: 'center' },
  restart: { marginTop: 20, padding: 12, borderWidth: 2, borderColor: 'white' },
  restartText: { color: 'white', fontSize: 18 },
shield: {
  position: 'absolute',
  width: PLAYER_WIDTH + 24,
  height: 56,
  borderRadius: 30,
  borderWidth: 3,
  borderColor: 'cyan',
  shadowColor: 'cyan',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.9,
  shadowRadius: 10,
},
  

});


