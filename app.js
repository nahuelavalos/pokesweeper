// Ocultar el contenedor principal al inicio
document.getElementById("containerPrincipal").style.display = "none";

document.body.style.backgroundColor = "black";
document.body.style.color = "white";

document.getElementById("playerContainer").style.backgroundColor = "dimgray";

document.getElementById("miTabla").style.backgroundColor = "transparent";
document.querySelectorAll("#miTabla td, #miTabla th").forEach(element => {
    element.style.backgroundColor = "transparent";
});

// Declarar matrizPokemones como variable global
let tableroPartida = []
let player = {
    hpMax: 18,
    hpLimit: 5,
    hp: 5,
    lv: 1,
    xpMax: 27,
    xpNext: 5,
    xp: 0,
}

console.log(player)

// Seleccionar la primera columna
var columnaPlayer = document.getElementById("columnaUnificada");
// Crear un elemento <img>
var img = document.createElement("img");
img.src = "./img/Oro.png"; // URL de la imagen
img.alt = "Imagen"; // Texto alternativo
img.style.border = "3px solid silver";
img.style.background = "darkgray";
img.style.borderRadius = "4px";
//img.style.width = "100%"; // Ajustar el tamaño
// Insertar la imagen en la celda
columnaPlayer.appendChild(img);
// Agregar el event listener para detectar el clic
img.addEventListener('click', function() {
    if (player.hp < 0 || (tableroPartida !== null && tableroPartida[4][6].battled == "true")) {
        window.location.replace(window.location.href);
    } else if (player.xp >= player.xpNext) {
        img.style.border = "3px solid silver";
        player.xp -= player.xpNext;
        
        if (player.xpNext < player.xpMax) {
            player.xpNext++;
        }
        while (player.xpNext % 3 != 0) { //|| player.xpNext == 6) && player.xpNext != 8) {
            player.xpNext++;
        }

        if (player.hpLimit < player.hpMax) {
            player.hpLimit++;
        }
        
        player.hp = player.hpLimit;

        agregarCorazonesEnFilaHP()
        agregarBotonesEnFilaXP();
    }
});



agregarCorazonesEnFilaHP()
agregarBotonesEnFilaXP();



document.getElementById("filaXP").addEventListener("click", function() {
    // Limpiar contenido previo
    this.innerHTML = "";

    // Crear un contenedor `div` para los botones y centrarlo
    const buttonContainer = document.createElement("div");
    buttonContainer.style.display = "flex";
    buttonContainer.style.justifyContent = "center";
    buttonContainer.style.gap = "10px"; // Espaciado entre botones

    // Crear 5 botones dentro de la celda
    for (let i = 1; i <= 5; i++) {
        let button = document.createElement("button");
        button.textContent = `Botón ${i}`;
        button.classList.add("btn", "btn-primary"); // Estilo Bootstrap
        buttonContainer.appendChild(button);
    }

    // Agregar el contenedor con los botones a la celda
    this.appendChild(buttonContainer);
});


const fetchPokemonData = async () => {
    try {
        const response = await fetch('./db.json'); // Esperamos a que se resuelva el fetch
        const db = await response.json(); // Convertimos la respuesta a JSON
        if (db && Array.isArray(db)) {
            //console.log(db);
            
            const pokemones = buscarPokemon(db); // Guardamos los Pokémon en el array
            //console.log(pokemones);

            const matrizPokemones = agruparPorCP(pokemones); // Agrupamos por CP
            //console.log(matrizPokemones);

            const pokemonesRandom = generarPokemonesRandom(matrizPokemones);
            //console.log(pokemonesRandom);

            const arrayCompleto = crearArrayCompleto(pokemonesRandom);
            //console.log("Array completo:", arrayCompleto);

            const tableroMatriz = asignarPokemonesAGrid(arrayCompleto);
            //console.log(tableroMatriz);

            tableroPartida = calcularAroundParaCeldasVacias(tableroMatriz);
            //console.log(tableroPartida);

            actualizarButtonGridConAround(tableroPartida);

            img.onload = () => {
                console.log("Imagen cargada");
                document.getElementById("containerPrincipal").style.display = "block";
            };
            if (img.complete) {
                console.log("Imagen ya estaba en caché");
                document.getElementById("containerPrincipal").style.display = "block";
            }
        }
    } catch (err) {
        console.log(err);
    }
};

const buscarPokemon = (db) => {
    return db
        .filter(pokemon => pokemon.id <= 151)
        .map(pokemon => {
            return {
                visible: false,
                cp: pokemon.cp,
                battled: false,
                exp: pokemon.cp,
                collected: false,
                name: pokemon.name.english, // Solo el nombre en inglés
                around: 0,
                unown: false,
                item: "",
            };
        });
};

// Agrupa los Pokémon por "cp" en una matriz
const agruparPorCP = (pokemones) => {
    const grupos = {};

    // Agrupar Pokémon en un objeto donde la clave sea el valor de CP
    pokemones.forEach(pokemon => {
        if (!grupos[pokemon.cp]) {
            grupos[pokemon.cp] = []; // Inicializamos un grupo vacío si no existe
        }
        grupos[pokemon.cp].push(pokemon);
    });

    // Convertimos el objeto en una matriz, donde cada columna es un grupo de CP
    const matriz = Object.values(grupos);
    return matriz;
};

// Genera un array de pokemones aleatorios basado en las reglas
const generarPokemonesRandom = (matrizPokemones) => {
    const pokemonesRandom = [];
    const nombresAgregados = new Set(); // Conjunto para evitar duplicados por nombre
    const cpContador = {}; // Para contar cuántos Pokémon se han agregado por CP

    // Lista de CP que se deben incluir completamente
    const incluirTodos = [0, 8, 9, 12, 18];

    // Lista de nombres que deben estar sí o sí
    const nombresObligatorios = ["Bulbasaur", "Charmander", "Squirtle", "Gyarados", "Aerodactyl"];

    // Reglas para la cantidad máxima de Pokémon por CP
    const seleccionRandomPorCP = {
        1: 11,
        2: 9,
        3: 9,
        4: 7,
        5: 7,
        6: 5,
        7: 5
    };

    // Inicializar el contador de CP
    Object.keys(seleccionRandomPorCP).forEach(cp => cpContador[cp] = 0);

    // 🔹 1) Incluir TODOS los Pokémon de los CP indicados en incluirTodos (sin restricciones)
    incluirTodos.forEach(cp => {
        const grupo = matrizPokemones.find(g => g.length > 0 && g[0].cp === cp);
        if (grupo) {
            grupo.forEach(pokemon => {
                if (!nombresAgregados.has(pokemon.name)) {
                    pokemonesRandom.push(pokemon);
                    nombresAgregados.add(pokemon.name);
                }
            });
        }
    });

    // 🔹 2) Incluir Pokémon obligatorios si aún no están y respetando los límites de CP
    nombresObligatorios.forEach(nombre => {
        const pokemon = matrizPokemones.flat().find(p => p.name === nombre);
        if (pokemon) {
            const cp = pokemon.cp;
            if (!nombresAgregados.has(nombre) && cpContador[cp] < seleccionRandomPorCP[cp]) {
                pokemonesRandom.push(pokemon);
                nombresAgregados.add(nombre);
                cpContador[cp]++;
            }
        }
    });

    // 🔹 3) Seleccionar aleatoriamente Pokémon según las reglas de CP, evitando duplicados
    Object.entries(seleccionRandomPorCP).forEach(([cp, cantidad]) => {
        const grupo = matrizPokemones.find(g => g.length > 0 && g[0].cp === Number(cp));
        if (grupo) {
            const disponibles = grupo.filter(pokemon => !nombresAgregados.has(pokemon.name));
            const seleccionados = seleccionarRandom(disponibles, cantidad - cpContador[cp]);

            seleccionados.forEach(pokemon => {
                pokemonesRandom.push(pokemon);
                nombresAgregados.add(pokemon.name);
                cpContador[cp]++;
            });
        }
    });

    return pokemonesRandom;
};



// Selecciona un subconjunto de elementos aleatorios de un array
const seleccionarRandom = (array, cantidad) => {
    const copia = [...array];
    const seleccionados = [];
    for (let i = 0; i < cantidad && copia.length > 0; i++) {
        const indice = Math.floor(Math.random() * copia.length); // Seleccionar índice aleatorio
        seleccionados.push(copia.splice(indice, 1)[0]); // Eliminar y añadir a seleccionados
    }
    return seleccionados;
};

// Función para ubicar a Mewtwo en una posición específica
const ubicarMewtwo = (arrayCompleto) => {
    const mewtwoIndex = arrayCompleto.findIndex(item => item.name === "Mewtwo");
    if (mewtwoIndex !== -1) {
        const mewtwo = arrayCompleto.splice(mewtwoIndex, 1)[0]; // Remover a Mewtwo del array
        const button = Array.from(buttonGrid.querySelectorAll('button')).find(
            btn => btn.dataset.x == 4 && btn.dataset.y == 6
        );
        mewtwo.visible = true
        if (button) {
            button.textContent = mewtwo.cp;
            button.dataset.pokemonName = mewtwo.name;
            button.dataset.cp = mewtwo.cp;
            button.dataset.visible = mewtwo.visible;
            button.dataset.pokemonName = mewtwo.name;
            button.dataset.battled = mewtwo.battled;
            button.dataset.exp = mewtwo.exp;
            button.dataset.collected = mewtwo.collected;
            button.dataset.around = mewtwo.around;
            button.dataset.unown = mewtwo.unown;
            button.dataset.item = mewtwo.item;

            //button.addEventListener('click', () => {
            //    alert(`¡Has seleccionado a ${mewtwo.name} con CP ${mewtwo.cp}!`);
            //});

            button.addEventListener('click', () => manejarClickButton(button));

            addImageToButton(4, 6, `./img/${mewtwo.name}_mini.png`);
        }
    }
};

const ubicarDestellos = (arrayCompleto, pd) => {
    const restriccionesFilas = [0, 1, 8, 9];
    const restriccionesColumnas = [0, 1, 11, 12];
    const restriccionesPosiciones = [
        [3, 5], [3, 6], [3, 7],
        [4, 5], [4, 6], [4, 7],
        [5, 5], [5, 6], [5, 7],
    ];

    // Generar todas las posiciones válidas según las restricciones
    const generarPosicionesValidas = () => {
        const posiciones = [];
        for (let x = 0; x < rows; x++) {
            for (let y = 0; y < cols; y++) {
                const esValida =
                    !restriccionesFilas.includes(x) &&
                    !restriccionesColumnas.includes(y) &&
                    !restriccionesPosiciones.some(pos => pos[0] === x && pos[1] === y);
                if (esValida) {
                    posiciones.push([x, y]);
                }
            }
        }
        return posiciones;
    };

    const posicionesValidas = generarPosicionesValidas();

    const destellos = arrayCompleto.filter(item => item.name === "destello");
    let colocados = 0;

    const asignarDestello = (destello, x, y) => {
        destello.posicion = [x, y];
        const button = Array.from(buttonGrid.querySelectorAll('button')).find(
            btn => Number(btn.dataset.x) === x && Number(btn.dataset.y) === y
        );
        if (button) {
            button.dataset.pokemonName = destello.name;
            button.dataset.cp = destello.cp;
            button.dataset.visible = destello.visible;
            button.dataset.pokemonName = destello.name;
            button.dataset.battled = destello.battled;
            button.dataset.exp = destello.exp;
            button.dataset.collected = destello.collected;
            button.dataset.around = destello.around;
            button.dataset.unown = destello.unown;
            button.dataset.item = destello.item;

            // Modificar el evento de clic en cada botón
            button.addEventListener('click', () => manejarClickButton(button));

            addImageToButton(x, y, `./img/${destello.name}_mini.png`);

            let elemento = {x: x, y: y}
            pd.push(elemento)
        }
    };

    // Mientras queden destellos por colocar y posiciones válidas disponibles
    while (colocados < destellos.length && posicionesValidas.length > 0) {
        const indiceAleatorio = Math.floor(Math.random() * posicionesValidas.length);
        const [x, y] = posicionesValidas[indiceAleatorio];

        // Verificar que la posición cumple con la separación mínima
        const separacionCumplida = destellos.slice(0, colocados).every(destello => {
            const [dx, dy] = destello.posicion || [-Infinity, -Infinity];
            return Math.abs(dx - x) > 3 || Math.abs(dy - y) > 3;
        });

        if (separacionCumplida) {
            asignarDestello(destellos[colocados], x, y);
            posicionesValidas.splice(indiceAleatorio, 1); // Eliminar la posición usada
            colocados++;
        } else {
            posicionesValidas.splice(indiceAleatorio, 1); // Eliminar posición no válida
        }
    }

    if (colocados < destellos.length) {
        console.warn("No se pudieron ubicar todos los destellos debido a las restricciones.");
    }
};

function generarRestricciones(posiciones, incluirCentro = true) {
    const restricciones = [];

    for (const pos of posiciones) {
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (incluirCentro || dx !== 0 || dy !== 0) {
                    restricciones.push([pos.x + dx, pos.y + dy]);
                }
            }
        }
    }

    return restricciones;
}

const ubicarPociones = (arrayCompleto, pd, posicionesPociones) => {
    const restriccionesPosiciones = [
        [4, 6], // Posición fija (Mewtwo)
        ...generarRestricciones(pd, true) // Incluye el centro
    ];
    
    const posicionesPrimerPocion = generarRestricciones(pd, false); // Excluye el centro

    // Generar todas las posiciones válidas según las restricciones
    const generarPosicionesValidasPociones = () => {
        const posiciones = [];
        for (let x = 0; x < rows; x++) {
            for (let y = 0; y < cols; y++) {
                const esValida = !restriccionesPosiciones.some(([rx, ry]) => rx === x && ry === y);
                if (esValida) {
                    posiciones.push([x, y]);
                }
            }
        }
        return posiciones;
    };

    const posicionesValidasPociones = generarPosicionesValidasPociones();

    const pociones = arrayCompleto.filter(item => item.name === "pocion");
    let colocados = 0;

    const asignarPocion = (pocion, x, y) => {
        pocion.posicion = [x, y];
        posicionesPociones.push(pocion.posicion);
        
        const button = Array.from(buttonGrid.querySelectorAll('button')).find(
            btn => Number(btn.dataset.x) === x && Number(btn.dataset.y) === y
        );
        if (button) {
            button.dataset.pokemonName = pocion.name;
            button.dataset.cp = pocion.cp;
            button.dataset.visible = pocion.visible;
            button.dataset.pokemonName = pocion.name;
            button.dataset.battled = pocion.battled;
            button.dataset.exp = pocion.exp;
            button.dataset.collected = pocion.collected;
            button.dataset.around = pocion.around;
            button.dataset.unown = pocion.unown;
            button.dataset.item = pocion.item;

            button.addEventListener('click', () => manejarClickButton(button));
            addImageToButton(x, y, `./img/${pocion.name}_mini.png`);
            const img = button.querySelector("img");
            if (img) {
                button.style.color = "transparent";
                img.style.visibility = "hidden"; // Oculta la imagen
            }
        }
    };

    // Mientras queden pociones por colocar y posiciones válidas disponibles
    while (colocados < pociones.length && posicionesValidasPociones.length > 0) {
        let aux
        if (posicionesValidasPociones.length === 111) {
            aux = posicionesPrimerPocion
        } else {
            aux = posicionesValidasPociones
        }

        const indiceAleatorio = Math.floor(Math.random() * aux.length);
        const [x, y] = aux[indiceAleatorio];

        asignarPocion(pociones[colocados], x, y);
        posicionesValidasPociones.splice(indiceAleatorio, 1);
        colocados++;
    }

    if (colocados < pociones.length) {
        console.warn("No se pudieron ubicar todas los pociones debido a las restricciones");
    }
};

function ubicarObjetosEspeciales(arrayCompleto, posicionesDestellos, posicionesPociones) {
    const restricciones = generarRestricciones(posicionesDestellos);
    restricciones.push([4, 6]); // Bloquear también (4,6)

    // Obtener objetos que deben ser colocados
    const objetos = arrayCompleto.filter(item =>
        ["bomba", "mochila", "Unown_A", "Unown_B", "blue", "lance", "Mew"/*,"Bulbasaur","Charmander","Squirtle","Gyarados","Aerodactyl"*/].includes(item.name)
    );

    // Generar posiciones válidas
    let posicionesValidas = [];
    for (let x = 0; x < rows; x++) {
        for (let y = 0; y < cols; y++) {
            if (!restricciones.some(([rx, ry]) => rx === x && ry === y) && !posicionesPociones.some(([rx, ry]) => rx === x && ry === y)) {
                posicionesValidas.push([x, y]);
            }
        }
    }

    shuffleArray(posicionesValidas); // Mezclar las posiciones disponibles

    let colocados = 0;
    objetos.forEach(objeto => {
        if (posicionesValidas.length === 0) {
            console.warn(`No hay espacio suficiente para colocar ${objeto.name}`);
            return;
        }

        const [x, y] = posicionesValidas.pop(); // Sacar una posición aleatoria

        // Asignar la posición al objeto
        objeto.posicion = [x, y];

        // Buscar el botón correspondiente en el grid
        const button = Array.from(buttonGrid.querySelectorAll('button')).find(
            btn => Number(btn.dataset.x) === x && Number(btn.dataset.y) === y
        );

        if (button) {
            button.innerHTML = ""; 
            button.style.color = "";

            button.dataset.pokemonName = objeto.name;
            button.dataset.cp = objeto.cp;
            button.dataset.visible = objeto.visible;
            button.dataset.battled = objeto.battled;
            button.dataset.exp = objeto.exp;
            button.dataset.collected = objeto.collected;
            button.dataset.around = objeto.around;
            button.dataset.unown = objeto.unown;
            button.dataset.item = objeto.item;

            if (button.dataset.pokemonName == "Mew") {
                button.dataset.item = "detonador"
                //button.style.backgroundColor = "goldenrod";
            } else if (button.dataset.pokemonName == "blue") {
                //button.style.backgroundColor = "darkblue";    
            } else if (button.dataset.pokemonName == "lance") {
                //button.style.backgroundColor = "darkgreen";    
            }

            // Agregar evento de clic
            button.addEventListener('click', () => manejarClickButton(button));

            if ((objeto.cp > 0 && objeto.name !== "tabla") || objeto.name === "Ditto") {
                button.textContent = objeto.cp;
                button.style.color = "yellow";
                button.style.fontFamily = 'Calibri, sans-serif';
            }
            addImageToButton(x, y, `./img/${objeto.name}_mini.png`);
            const img = button.querySelector("img");
            if (img) {
                button.style.color = "transparent"; // Hacer el texto transparente
                img.style.visibility = "hidden"; // Ocultar la imagen
            }

            colocados++;
        }
    });

    //console.log(`Objetos colocados: ${colocados}/${objetos.length}`);
}

// Función que asigna Pokémon y eventos a los botones
function asignarPokemonesAGrid(arrayCompleto) {
    let posicionesDestellos = [];
    let posicionesPociones = [];

    // Ubicar elementos especiales antes de asignar los Pokémon normales
    ubicarMewtwo(arrayCompleto);
    ubicarDestellos(arrayCompleto, posicionesDestellos);
    ubicarPociones(arrayCompleto, posicionesDestellos, posicionesPociones);
    ubicarObjetosEspeciales(arrayCompleto, posicionesDestellos, posicionesPociones);

    // Filtrar los Pokémon restantes
    const pokemonesRestantes = arrayCompleto.filter(
        item => item.name !== "Mewtwo" && item.name !== "destello" && item.name !== "pocion" && item.name !== "bomba" && item.name !== "mochila" && item.name !== "Unown_A" && item.name !== "Unown_B" && item.name !== "blue" && item.name !== "lance" && item.name !== "Mew"// && item.name !== "Bulbasaur" && item.name !== "Charmander" && item.name !== "Squirtle" && item.name !== "Gyarados" && item.name !== "Aerodactyl"
    );

    // Obtener todos los botones del grid que aún no tienen Pokémon asignado
    const botones = Array.from(buttonGrid.querySelectorAll('button')).filter(
        btn => !btn.dataset.pokemonName
    );

    // Mezclar los botones restantes aleatoriamente
    shuffleArray(botones);

    // Asignar cada Pokémon a un botón
    pokemonesRestantes.forEach((pokemon, index) => {
        if (index < botones.length) {
            const button = botones[index];
            if ((pokemon.cp > 0 && pokemon.name !== "tabla") || pokemon.name === "Ditto") {
                button.textContent = pokemon.cp;
            }
            button.dataset.cp = pokemon.cp;
            button.dataset.visible = pokemon.visible;
            button.dataset.pokemonName = pokemon.name;
            button.dataset.battled = pokemon.battled;
            button.dataset.exp = pokemon.exp;
            if (pokemon.name == "Ditto") {
                button.dataset.exp = 3;
            }
            button.dataset.collected = pokemon.collected;
            button.dataset.around = pokemon.around;
            button.dataset.unown = pokemon.unown;
            button.dataset.item = pokemon.item;

            // Agregar evento de click al botón usando la nueva función unificada
            button.addEventListener('click', () => manejarClickButton(button));

            // Añadir imagen al botón
            addImageToButton(Number(button.dataset.x), Number(button.dataset.y), `./img/${pokemon.name}_mini.png`);

            const img = button.querySelector("img"); // Selecciona la imagen dentro del botón
            if (img) {
                button.style.color = "transparent";
                img.style.visibility = "hidden"; // Oculta la imagen
            }

        }
    });

    // Crear la matriz tablero desde el grid
    return crearTableroDesdeGrid(buttonGrid);
}

function manejarClickButton(button) {
    const x = Number(button.dataset.x);
    const y = Number(button.dataset.y);
    const celda = tableroPartida[x][y];

    if (!celda || player.hp < 0 || (tableroPartida[4][6].battled === "true") || ((celda.pokemonName==="tabla" || celda.pokemonName==="tabla_2" || celda.pokemonName==="tabla_3") && player.hp == 0 && celda.battled !== "true" && celda.visible === "true" )) return; // Si no hay celda, salir

    //REVISAR
    button.style.color = "";
    if (celda.cp <= player.hp || celda.cp == "?") {
        button.style.backgroundColor = "darkslategray"; // color descubierto
    } else {
        button.style.backgroundColor = "darkred";
        const img = button.querySelector("img");
        if (img) {
            img.style.visibility = "visible"; // Oculta la imagen
        }
    }

    if (tableroPartida[x][y].visible !== "true" && (celda.item == "experiencia" || celda.item == "pocion" || celda.item == "destello" || (celda.pokemonName == "bomba" && celda.battled === "true") || celda.pokemonName == "pocion" || celda.pokemonName == "tabla")) {
            if (celda.pokemonName !== "") {
                addImageToButton(x, y, `./img/${celda.pokemonName}_mini.png`);
                
            }

            if (celda.pokemonName == "pocion") {
                button.style.border = "1px solid lightgreen";
                button.style.backgroundColor = "seagreen";
            } else if (celda.pokemonName == "mochila" || celda.pokemonName == "tabla") {
                button.style.border = "1px solid black";
                button.style.backgroundColor = "#6C757D";
            } else if (celda.pokemonName == "bomba") {
                button.textContent = `${tableroPartida[x][y].exp} XP`;
                addImageToButton(x, y, `./img/${celda.pokemonName}_mini.png`);
                button.style.color = 'white';
                button.style.fontFamily = 'Calibri, sans-serif';
                button.style.fontSize = "11px";
                button.style.border = "1px solid cyan";
                button.style.backgroundColor = "darkcyan";
                
            }
            
            const img = button.querySelector("img");
            if (img) {
                button.style.color = "";
                button.style.fontFamily = 'Calibri, sans-serif';
                img.style.visibility = "visible";
            }
        
        tableroPartida[x][y].visible = "true";
        return;
    }


    tableroPartida[x][y].visible = "true";

    if (!celda || player.hp < 0) return; // Si no hay celda, salir

    if (celda.item !== "" && !(celda.pokemonName == "Mew" && celda.battled == "true") && !(celda.pokemonName == "blue" && celda.battled == "true") && !(celda.pokemonName == "lance" && celda.battled == "true")) {
        if (celda.item === "pocion") {
            tableroPartida[x][y].pokemonName = celda.item;
            tableroPartida[x][y].battled = "false";
            tableroPartida[x][y].collected = "true";

            button.style.color = 'white';
            button.style.fontFamily = 'Calibri, sans-serif';
            button.style.fontSize = "11px";
            button.style.border = "1px solid lightgreen";
            button.style.backgroundColor = "seagreen";

            tableroPartida[x][y].item = "";
        } else if (celda.item === "experiencia") {
            tableroPartida[x][y].pokemonName = celda.item;
            tableroPartida[x][y].exp = 5

            button.style.color = 'white';
            button.style.fontFamily = 'Calibri, sans-serif';
            button.style.fontSize = "11px";
            button.style.border = "1px solid cyan";
            button.style.backgroundColor = "darkcyan";
            button.textContent = `${tableroPartida[x][y].exp} XP`;

            tableroPartida[x][y].item = "";
        } else if (celda.item === "destello") {
            tableroPartida[x][y].pokemonName = celda.item;

            button.style.color = 'white';
            button.style.fontFamily = 'Calibri, sans-serif';
            button.style.fontSize = "11px";
            button.style.border = "1px solid yellow";
            button.style.backgroundColor = "darkgoldenrod";

            tableroPartida[x][y].item = "";
        } else if (celda.item === "tabla_2" || celda.item === "tabla_3") { 
            player.hp -= 1
            if (celda.pokemonName === "tabla" && celda.item == "tabla_3" ) {
                tableroPartida[x][y].pokemonName = "tabla_2"
                tableroPartida[x][y].item = "tabla_3"
                button.style.border = "1px solid black";
                button.style.backgroundColor = "#6C757D";
            } else if (celda.pokemonName === "tabla" && celda.item === "tabla_2") {
                tableroPartida[x][y].pokemonName = celda.item
                tableroPartida[x][y].item = "";
                button.style.border = "1px solid black";
                button.style.backgroundColor = "#6C757D";
            } else if (celda.pokemonName === "tabla_2" && celda.item === "tabla_3") {
                tableroPartida[x][y].pokemonName = "tabla_3"
                tableroPartida[x][y].item = "";
                button.style.border = "1px solid black";
                button.style.backgroundColor = "#6C757D";
            }
    
            agregarCorazonesEnFilaHP()
        } else if (celda.item === "detonador") {
            player.hp -= celda.cp
            tableroPartida[x][y].collected = "false";
            tableroPartida[x][y].battled = "true";

            if (player.hp >= 0) {
                button.textContent = `${celda.exp} XP`;
                button.style.color = 'white';
                button.style.fontFamily = 'Calibri, sans-serif';
                button.style.fontSize = "11px";
                button.style.border = "1px solid cyan";
                button.style.backgroundColor = "darkcyan";
            } else {

                if (player.hp < 0) {
                    //alert("¡Has perdido! El HP ha llegado a 0.");
                    img.style.filter = "grayscale(60%)";
                    img.style.border = "3px solid red";
                    celda.battled = "false";
                    //img.style.visibility = "visible"; 
                }

                button.style.backgroundColor = "darkred";
            }

            agregarCorazonesEnFilaHP()
                
        } else if (celda.item === "ratitas") {
            player.hp -= celda.cp
            tableroPartida[x][y].collected = "false";
            tableroPartida[x][y].battled = "true";

            if (player.hp >= 0) {
                button.textContent = `${celda.exp} XP`;
                button.style.color = 'white';
                button.style.fontFamily = 'Calibri, sans-serif';
                button.style.fontSize = "11px";
                button.style.border = "1px solid lightblue";
                button.style.backgroundColor = "royalblue";
            } else {

                if (player.hp < 0) {
                    //alert("¡Has perdido! El HP ha llegado a 0.");
                    img.style.filter = "grayscale(60%)";
                    img.style.border = "3px solid red";
                    celda.battled = "false";
                    //img.style.visibility = "visible"; 
                }

                button.style.backgroundColor = "darkred";
            }
            agregarCorazonesEnFilaHP()
        } else if (celda.item === "pulentas") {
            player.hp -= celda.cp
            tableroPartida[x][y].collected = "false";
            tableroPartida[x][y].battled = "true";

            if (player.hp >= 0) {
                button.textContent = `${celda.exp} XP`;
                button.style.color = 'white';
                button.style.fontFamily = 'Calibri, sans-serif';
                button.style.fontSize = "11px";
                button.style.border = "1px solid moccasin";
                button.style.backgroundColor = "peru";
            } else {

                if (player.hp < 0) {
                    //alert("¡Has perdido! El HP ha llegado a 0.");
                    img.style.filter = "grayscale(60%)";
                    img.style.border = "3px solid red";
                    celda.battled = "false";
                    //img.style.visibility = "visible"; 
                }

                button.style.backgroundColor = "darkred";
            }
            agregarCorazonesEnFilaHP()
        }

        console.log(tableroPartida[x][y])
    
        if (tableroPartida[x][y].pokemonName !== null) {
            addImageToButton(x, y, `./img/${tableroPartida[x][y].pokemonName}_mini.png`);
        }

        return;
    }


    if (celda.battled === "false") {  
        player.hp -= celda.cp;
        //console.log(player.hp < 0 ? "¡Has perdido!" : `¡Has sido atacado por un Pokémon con CP ${celda.cp}! Tu HP ahora es ${player.hp}.`);
        celda.battled = "true";
        if (player.hp < 0) {
            //alert("¡Has perdido! El HP ha llegado a 0.");
            img.style.filter = "grayscale(60%)";
            img.style.border = "3px solid red";
            celda.battled = "false";
        }
        
        agregarCorazonesEnFilaHP()

        if (celda.pokemonName === "pocion") {
            player.hp = player.hpLimit;
            recolectarObjeto(celda, button);
        } else if (celda.pokemonName === "Mewtwo" && player.hp >= 0) {
            actualizarBotonTrasBatalla(button, celda, x, y);
            img.src = "./img/Oro3.png";
            img.style.border = "3px solid gold";

        } else if (celda.collected !== "true" && celda.battled == "true") {
            actualizarBotonTrasBatalla(button, celda, x, y);
        }

        if (player.hp == 0) {
            //alert("¡Has perdido! El HP ha llegado a 0.");
            //img.src = "./img/Oro2.png";
        }

    } else if (celda.battled === "true") {
        recolectarObjeto(celda, button);
    }

    console.log("PLAYER ATACADO", player);
    console.log("TABLERO MODIFICADO", tableroPartida);
}

function recolectarObjeto(celda, button) {
    player.xp += celda.exp

    if (celda.pokemonName == "detonador") {
        tableroPartida = actualizarBombasEnTablero(tableroPartida);
        actualizarCPEnButtonGrid(tableroPartida)
    } else if (celda.pokemonName == "ratitas") {
        actualizarRatitasEnButtonGrid(tableroPartida);
    } else if (celda.pokemonName == "pulentas") {
        actualizarPulentasEnButtonGrid(tableroPartida);
    } else if (celda.pokemonName == "destello") {
        mostrarBotonesAlrededor(celda.x, celda.y, tableroPartida);
    }

    if (celda.item == "detonador") {
        celda.pokemonName = celda.item; //PRIMERO TIENE QUE APARECER PARA COLECTAR
        celda.item = "";
        celda.exp = 0;
        
        button.textContent = "";
        button.style.color = 'white';
        button.style.fontFamily = 'Calibri, sans-serif';
        button.style.fontSize = "11px";
        button.style.border = "1px solid chocolate";
        button.style.backgroundColor = "khaki";
        
        //addImageToButton(celda.x, celda.y, `./img/${celda.pokemonName}_mini.png`);
        setTimeout(() => addImageToButton(celda.x, celda.y, `./img/${celda.pokemonName}_mini.png`), 0);
        //Object.assign(celda, { collected: "false", cp: 0, pokemonName: celda.pokemonName, unown: "false" });
    } else if (celda.item == "ratitas") {
        celda.pokemonName = celda.item; //PRIMERO TIENE QUE APARECER PARA COLECTAR
        celda.item = "";
        celda.exp = 0;
        
        button.textContent = "";
        button.style.color = 'white';
        button.style.fontFamily = 'Calibri, sans-serif';
        button.style.fontSize = "11px";
        button.style.border = "1px solid chocolate";
        button.style.backgroundColor = "khaki";
        
        //addImageToButton(celda.x, celda.y, `./img/${celda.pokemonName}_mini.png`);
        setTimeout(() => addImageToButton(celda.x, celda.y, `./img/${celda.pokemonName}_mini.png`), 0);
        //Object.assign(celda, { collected: "false", cp: 0, pokemonName: celda.pokemonName, unown: "false" });
    } else if (celda.item == "pulentas") {
        celda.pokemonName = celda.item; //PRIMERO TIENE QUE APARECER PARA COLECTAR
        celda.item = "";
        celda.exp = 0;
        
        button.textContent = "";
        button.style.color = 'white';
        button.style.fontFamily = 'Calibri, sans-serif';
        button.style.fontSize = "11px";
        button.style.border = "1px solid chocolate";
        button.style.backgroundColor = "khaki";
        
        //addImageToButton(celda.x, celda.y, `./img/${celda.pokemonName}_mini.png`);
        setTimeout(() => addImageToButton(celda.x, celda.y, `./img/${celda.pokemonName}_mini.png`), 0);
        //Object.assign(celda, { collected: "false", cp: 0, pokemonName: celda.pokemonName, unown: "false" });
    } else {
        Object.assign(celda, { collected: "true", cp: 0, pokemonName: null, unown: "false", exp: 0 });

        Object.assign(button.style, {
            fontSize: "16px",
            border: "1px solid black",
            backgroundColor: "darkslategray"
        });
    }

    button.textContent = "";
    button.dataset.unown = "false";

    tableroPartida = calcularAroundParaCeldasVacias(tableroPartida);
    actualizarButtonGridConAround(tableroPartida);

    agregarCorazonesEnFilaHP()
    agregarBotonesEnFilaXP();
}

function actualizarCPEnButtonGrid(tablero) {
    const buttons = buttonGrid.querySelectorAll('button');

    buttons.forEach(button => {
        const x = button.dataset.x;
        const y = button.dataset.y;
        const celda = tablero[x][y];

        if (celda !== null && celda !== undefined && celda.pokemonName === "bomba" ) {
            button.textContent = celda.cp === 0 ? "" : celda.cp; // Si CP es 0, deja vacío
        }
    });
}

function actualizarBombasEnTablero(tablero) {
    const rows = tablero.length;
    const cols = tablero[0].length;

    for (let x = 0; x < rows; x++) {
        for (let y = 0; y < cols; y++) {
            const celda = tablero[x][y];

            // Verificar si la celda no es nula y es una bomba con cp 100
            if (celda !== null && celda !== undefined && celda.pokemonName === "bomba" && celda.cp === 100) {
                tablero[x][y].cp = 0;
                tablero[x][y].battled = "true";  // Marca como batallado
            }
        }
    }

    return tablero;
}

function actualizarRatitasEnButtonGrid(tablero) {
    const rows = tablero.length;
    const cols = tablero[0].length;

    for (let x = 0; x < rows; x++) {
        for (let y = 0; y < cols; y++) {
            const celda = tablero[x][y];

            if (celda !== null && celda !== undefined && celda.cp === 1 && celda.pokemonName !== "tabla") {
                const button = Array.from(buttonGrid.querySelectorAll("button")).find(
                    btn => btn.dataset.x == x && btn.dataset.y == y
                );

                if (button) {
                    // Mostrar el texto en el botón
                    //button.textContent = celda.pokemonName || "1";
                    button.style.color = "yellow"; // Asegura que el texto sea visible
                    button.style.fontFamily = 'Calibri, sans-serif';
                    
                    // Mostrar la imagen si tiene un pokemonName válido
                    if (celda.pokemonName) {
                        let img = button.querySelector("img");
                        img.src = `./img/${celda.pokemonName}_mini.png`;
                        img.style.visibility = "visible"; // Asegura que la imagen se vea
                    }
                }
            }
        }
    }
}

function actualizarPulentasEnButtonGrid(tablero) {
    const rows = tablero.length;
    const cols = tablero[0].length;

    for (let x = 0; x < rows; x++) {
        for (let y = 0; y < cols; y++) {
            const celda = tablero[x][y];

            if (celda !== null && celda !== undefined && (celda.cp === 6 || celda.cp === 7) && celda.pokemonName !== "tabla") {
                const button = Array.from(buttonGrid.querySelectorAll("button")).find(
                    btn => btn.dataset.x == x && btn.dataset.y == y
                );

                if (button) {
                    // Mostrar el texto en el botón
                    //button.textContent = celda.pokemonName || "1";
                    button.style.color = "yellow"; // Asegura que el texto sea visible
                    button.style.fontFamily = 'Calibri, sans-serif';
                    
                    // Mostrar la imagen si tiene un pokemonName válido
                    if (celda.pokemonName) {
                        let img = button.querySelector("img");
                        img.src = `./img/${celda.pokemonName}_mini.png`;
                        img.style.visibility = "visible"; // Asegura que la imagen se vea
                    }
                }
            }
        }
    }
}

function mostrarBotonesAlrededor(x, y, tablero) {
    const posiciones = [
        [x - 1, y - 1], [x - 1, y], [x - 1, y + 1],
        [x, y - 1],                 [x, y + 1],
        [x + 1, y - 1], [x + 1, y], [x + 1, y + 1]
    ];

    posiciones.forEach(([nx, ny]) => {
        if (tablero[nx] && tablero[nx][ny]) {
            const celda = tablero[nx][ny];
            const button = Array.from(buttonGrid.querySelectorAll("button")).find(
                btn => btn.dataset.x == nx && btn.dataset.y == ny
            );

            if (button) {
                if (celda.pokemonName) {
                    let img = button.querySelector("img");
                    //tableroPartida[nx][ny].visible = "true";
                    //button.style.backgroundColor = "darkgray";
                    if (img) {
                        if (tableroPartida[nx][ny].visible !== "true") {
                            button.style.color = "yellow"; // Destacar el botón
                            button.style.backgroundColor = "#6C757D"; //btn-secondary
                            button.style.fontFamily = 'Calibri, sans-serif';
                        }
                        
                        img.src = `./img/${celda.pokemonName}_mini.png`;
                        img.style.visibility = "visible"; // Mostrar imagen
                    } 
                } else {
                    button.style.backgroundColor = "darkslategray";
                    button.style.fontFamily = 'Calibri, sans-serif';
                    button.textContent = celda.cp === '?' ? '?' : (celda.around || '');
                }

                tableroPartida[nx][ny].visible = "true";
            }
        }
    });
}

function agregarCorazonesEnFilaHP() {
    const celdaHP = document.getElementById("filaHP");

    // Limpiar la celda antes de insertar nuevos íconos
    celdaHP.innerHTML = "";
    celdaHP.style.display = "flex";  // Usar flexbox para alinear los íconos
    celdaHP.style.gap = "0";         // Eliminar separación entre los íconos
    celdaHP.style.justifyContent = "left"; // Alinear los íconos a la izquierda

    // Crear los íconos de corazones
    for (let i = 0; i < player.hpLimit; i++) {
        if (i > 0 && i % 5 === 0) {
            let espacio = document.createElement("span");
            espacio.style.marginRight = "14px"; // Espaciado entre grupos de 5
            celdaHP.appendChild(espacio);
        }
        
        let corazon = document.createElement("i");
        
        // Si el índice está por debajo del valor de player.hp, es un corazón lleno (verde)
        if (i < player.hp) {
            corazon.classList.add("fa-solid", "fa-heart"); // Corazón lleno
            corazon.style.color = "#60d76e"; // Verde para indicar vida
        } else {
            corazon.classList.add("fa-solid", "fa-heart"); // Corazón vacío
            corazon.style.color = "silver"; // Rojo para indicar vida máxima
        }

        corazon.style.fontSize = "25px"; // Tamaño del ícono
        corazon.style.marginRight = "6px"; // Separación entre corazones

        celdaHP.appendChild(corazon);
    }
}

function agregarBotonesEnFilaXP() {
    const celdaXP = document.getElementById("filaXP");

    // Limpiar la celda antes de insertar nuevos botones
    celdaXP.innerHTML = "";
    celdaXP.style.display = "flex";  // Usar flexbox para alinear botones
    celdaXP.style.gap = "0";         // Eliminar separación entre botones
    celdaXP.style.justifyContent = "left"; // Centrar los botones en la celda

    // Crear botones
    for (let i = 0; i < player.xpNext; i++) {
        let boton = document.createElement("button");
        boton.classList.add("btn", "btn-primary"); // Clases Bootstrap
        boton.style.width = "23px";  // Tamaño cuadrado
        boton.style.height = "23px"; // Tamaño cuadrado
        boton.style.padding = "0";   // Eliminar relleno interno
        boton.style.borderRadius = "2px"; // Bordes ligeramente redondeados (opcional)
        boton.style.margin = "-0.5";    // Eliminar margen
        boton.style.border = "1px solid aliceblue"; // Bordes visibles (opcional)
        boton.style.background = "darkcyan";
        if (i >= player.xp) {
            boton.style.background = "silver";
        }

        celdaXP.style.pointerEvents = "none";
        celdaXP.appendChild(boton);
    }

    if (player.xp >= player.xpNext) {
        img.style.border = "3px solid cyan";
    }

    // Verificar si player.xp es mayor a player.xpNext
    if (player.xp > player.xpNext) {
        // Crear el "+" al final de los botones
        let plusSpan = document.createElement("span");
        plusSpan.textContent = "+"; // El texto "+" que se agregará
        plusSpan.style.color = "cyan"; // Cambiar el color según desees
        plusSpan.style.fontSize = "17px"; // Tamaño del texto
        plusSpan.style.marginLeft = "6px"; // Separación entre los botones y el "+"
        plusSpan.style.fontWeight = 'bold';
        celdaXP.appendChild(plusSpan);
    }
}

function actualizarBotonTrasBatalla(button, celda, x, y) {
    if (tableroPartida[x][y].pokemonName !== "Mewtwo") {
        button.textContent = `${celda.exp} XP`;
        button.style.color = 'white';
        button.style.fontFamily = 'Calibri, sans-serif';
        button.style.fontSize = "11px";
        button.style.border = "1px solid cyan";
        button.style.backgroundColor = "darkcyan";
    } else {
        button.style.color = 'darkmagenta';
        button.textContent = "WIN";
        button.style.fontFamily = 'Calibri, sans-serif';
        button.style.fontSize = "11px";
        button.style.border = "1px solid magenta";
        button.style.backgroundColor = "thistle";
    }

    addImageToButton(x, y, `./img/${celda.pokemonName}_mini.png`);
}

// Función para crear la matriz tablero a partir de buttonGrid
function crearTableroDesdeGrid(buttonGrid) {
    // Obtener todas las posiciones únicas de las coordenadas x e y
    const botones = Array.from(buttonGrid.querySelectorAll('button'));
    const posicionesX = [...new Set(botones.map(btn => Number(btn.dataset.x)))].sort((a, b) => a - b);
    const posicionesY = [...new Set(botones.map(btn => Number(btn.dataset.y)))].sort((a, b) => a - b);

    // Inicializar la matriz tablero
    const tablero = posicionesY.map(() => Array(posicionesX.length).fill(null));

    // Llenar la matriz con los datos de los botones
    botones.forEach(button => {
        const x = Number(button.dataset.x);
        const y = Number(button.dataset.y);
        const pokemonName = button.dataset.pokemonName || null;
        const cp = button.dataset.cp ? Number(button.dataset.cp) : null;
        const battled = button.dataset.battled;
        const visible = button.dataset.visible;
        const exp = button.dataset.exp ? Number(button.dataset.exp) : null;
        const collected = button.dataset.collected;
        const around = button.dataset.around;
        const unown = button.dataset.unown;
        const item = button.dataset.item;

        // Insertar los datos en la matriz tablero
        tablero[x][y] = {
            pokemonName,
            cp,
            battled,
            visible,
            exp,
            collected,
            around,
            unown,
            item,
            x,
            y
        };
    });

    return tablero;
}

function calcularAroundParaCeldasVacias(tablero) {
    const rows = tablero.length;
    const cols = tablero[0].length;

    // Función para verificar si una posición está dentro de los límites del tablero
    function estaEnLimites(x, y) {
        return x >= 0 && x < rows && y >= 0 && y < cols;
    }

    // Iterar sobre todas las celdas del tablero
    for (let x = 0; x < rows; x++) {
        for (let y = 0; y < cols; y++) {
            const celda = tablero[x][y];

            // Verificar que la celda no sea null o undefined y esté vacía (pokemonName === null)
            if (celda !== null && celda !== undefined && celda.pokemonName === null) {
                let sumaCP = 0;
                //let tieneUnown = false;
                let tieneUnownVecino = false;

                // Si la celda ya tiene un '?', no hacer cálculos adicionales
                //if (celda.cp === '?') continue;
                celda.cp = 0

                // Iterar sobre los 8 vecinos
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        if (dx === 0 && dy === 0) continue; // Saltar la celda actual
                        const vecinoX = x + dx;
                        const vecinoY = y + dy;

                        // Verificar si el vecino está dentro de los límites
                        if (estaEnLimites(vecinoX, vecinoY)) {
                            const vecino = tablero[vecinoX][vecinoY];

                            // Verificar si el vecino es un Unown
                            if (vecino !== null && vecino !== undefined && vecino.unown === "true") {
                                tieneUnownVecino = true;
                            }

                            // Verificar si el vecino tiene un valor de CP y no tiene '?'
                            if (vecino !== null && vecino !== undefined && vecino.cp !== '?' && !tieneUnownVecino && vecino.pokemonName !== "tabla" && vecino.pokemonName !== "tabla_2" && vecino.pokemonName !== "tabla_3") {
                                sumaCP += vecino.cp;
                            }
                        }
                    }
                }

                // Si hay un Unown, asignar '?' a la celda actual
                if (tieneUnownVecino) {
                    celda.cp = '?';
                } else {
                    // Si no hay Unown, asignar la suma de CP
                    celda.around = sumaCP;
                }
            }
        }
    }

    return tablero;
}

function actualizarButtonGridConAround(tablero) {
    // Iterar sobre cada celda del tablero
    for (let x = 0; x < tablero.length; x++) {
        for (let y = 0; y < tablero[x].length; y++) {
            const celda = tablero[x][y];

            // Verificar si la celda está vacía (pokemonName === null)
            if (celda !== null && celda.pokemonName === null) {
                // Buscar el botón correspondiente en el grid
                const button = buttonGrid.querySelector(`button[data-x="${x}"][data-y="${y}"]`);

                if (button) {
                    // Actualizar el contenido del botón con el valor de around o '?' si cp es desconocido
                    button.textContent = celda.cp === '?' ? '?' : (celda.around || '');
                    //button.style.backgroundColor = "gray"; // Ejemplo: colorear los botones vacíos
                    button.style.color = 'white';
                    button.style.fontFamily = 'Calibri, sans-serif';

                    if (celda.visible !== "true") {
                        button.style.color = "transparent";
                    } else {
                        //button.style.backgroundColor = "";
                    }

                    button.addEventListener('click', () => manejarClickButton(button));

                }
            }
        }
    }

    //return tablero; // Devolver el tablero actualizado por si se necesita
}

// Mezcla un array aleatoriamente (algoritmo Fisher-Yates)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Crear la matriz de 10x13
const rows = 10;
const cols = 13;
const buttonGrid = document.getElementById('buttonGrid');

// Generar los botones
for (let x = 0; x < rows; x++) {
    const rowDiv = document.createElement('div');
    rowDiv.classList.add('row-container');

    for (let y = 0; y < cols; y++) {
        const button = document.createElement('button');
        button.classList.add('btn', 'btn-secondary');
        button.style.lineHeight = 'normal';
        button.style.paddingTop = '2px';
        button.style.borderColor = 'black';
        button.style.color = 'yellow';
        button.fontFamily = 'Calibri';
        button.style.fontWeight = 'bold';
        button.style.width = "58px";
        button.style.height = "58px";
        //button.textContent = `${x},${y}`; // Texto inicial con coordenadas
        button.dataset.x = x;
        button.dataset.y = y;

        rowDiv.appendChild(button);
    }

    buttonGrid.appendChild(rowDiv);
}

// Función para insertar o reemplazar una imagen en el botón
function addImageToButton(x, y, imagePath) {
    const button = Array.from(buttonGrid.querySelectorAll('button')).find(
        btn => btn.dataset.x == x && btn.dataset.y == y
    );

    if (button) {
        let img = button.querySelector("img"); // Buscar si ya hay una imagen dentro del botón
        if (img) {
            img.src = imagePath; // Si ya existe, reemplazar la imagen
        } else {
            img = document.createElement("img");
            img.src = imagePath;
            button.appendChild(img); // Si no hay imagen, agregar una nueva
        }
    }
}

// Función para crear un array de ítems adicionales
const generarItemsAdicionales = () => {
    const items = [
        ...Array(9).fill({ cp: 100, name: "bomba", visible: false, battled: false, exp: 2, collected: false, around: 0, unown: false, item: "" }),
        ...Array(7).fill({ cp: 0, name: "pocion", visible: false, battled: false, exp: 0, collected: true, around: 0, unown: false, item: "" }),
        ...Array(1).fill({ cp: 1, name: "tabla", visible: false, battled: false, exp: 1, collected: false, around: 0, unown: false, item: "" }),
        ...Array(1).fill({ cp: 1, name: "tabla", visible: false, battled: false, exp: 3, collected: false, around: 0, unown: false, item: "" }),
        ...Array(1).fill({ cp: 1, name: "tabla", visible: false, battled: false, exp: 1, collected: false, around: 0, unown: false, item: "tabla_2" }),
        ...Array(1).fill({ cp: 1, name: "tabla", visible: false, battled: false, exp: 3, collected: false, around: 0, unown: false, item: "tabla_2" }),
        ...Array(1).fill({ cp: 1, name: "tabla", visible: false, battled: false, exp: 1, collected: false, around: 0, unown: false, item: "tabla_3" }),
        ...Array(1).fill({ cp: 1, name: "tabla", visible: false, battled: false, exp: 3, collected: false, around: 0, unown: false, item: "tabla_3" }),
        ...Array(1).fill({ cp: 1, name: "tabla", visible: false, battled: false, exp: 5, collected: false, around: 0, unown: false, item: "tabla_3" }),
        ...Array(1).fill({ cp: 0, name: "mochila", visible: false, battled: true, exp: 0, collected: false, around: 0, unown: false, item: "pocion" }), //pocion
        ...Array(1).fill({ cp: 0, name: "mochila", visible: false, battled: true, exp: 0, collected: false, around: 0, unown: false, item: "experiencia" }), //experiencia
        ...Array(1).fill({ cp: 0, name: "mochila", visible: false, battled: true, exp: 0, collected: false, around: 0, unown: false, item: "destello" }), //destello
        ...Array(2).fill({ cp: 0, name: "destello", visible: true, battled: true, exp: 0, collected: false, around: 0, unown: false, item: "" }),
        { cp: 5, name: "Unown_A", visible: false, battled: false, exp: 5, collected: false, around: 0, unown: true, item: "" },
        { cp: 5, name: "Unown_B", visible: false, battled: false, exp: 5, collected: false, around: 0, unown: true, item: "" },
        { cp: 5, name: "blue", visible: false, battled: false, exp: 5, collected: false, around: 0, unown: false, item: "ratitas" },
        { cp: 10, name: "lance", visible: false, battled: false, exp: 10, collected: false, around: 0, unown: false, item: "pulentas"}
    ];
    return items;
};

// Crear el nuevo array que combine Pokémon random e ítems adicionales
const crearArrayCompleto = (pokemonesRandom) => {
    const itemsAdicionales = generarItemsAdicionales();
    return [...pokemonesRandom, ...itemsAdicionales];
};

fetchPokemonData()