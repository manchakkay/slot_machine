// Warn if overriding existing method
if (Array.prototype.equals)
    console.warn(
        "Overriding existing Array.prototype.equals. Possible causes: New API defines the method, there's a framework conflict or you've got double inclusions in your code."
    );
// attach the .equals method to Array's prototype to call it on any array
Array.prototype.equals = function (array) {
    // if the other array is a falsy value, return
    if (!array) return false;

    // compare lengths - can save a lot of time
    if (this.length != array.length) return false;

    for (var i = 0, l = this.length; i < l; i++) {
        // Check if we have nested arrays
        if (this[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!this[i].equals(array[i])) return false;
        } else if (this[i] != array[i]) {
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;
        }
    }
    return true;
};
// Hide method from for-in loops
Object.defineProperty(Array.prototype, "equals", { enumerable: false });

var support = {
    getWidth: function () {
        return Math.max(
            document.body.scrollWidth,
            document.documentElement.scrollWidth,
            document.body.offsetWidth,
            document.documentElement.offsetWidth,
            document.documentElement.clientWidth
        );
    }
};

var landing_scaler = {
    init: function () {
        this.resize();
        window.addEventListener("resize", () => {
            this.resize();
        });
    },
    resize: function () {
        let elem = document.querySelector(".land-wrapper");
        let w = support.getWidth();
        let s = 1;

        if (w >= 1200) {
            s = w / 1200;
        } else if (w >= 960) {
            s = w / 960;
        } else if (w >= 640) {
            s = w / 640;
        } else if (w >= 480) {
            s = w / 480;
        } else {
            s = w / 320;
        }

        elem.style.zoom = s;
    }
};

var slot_machine = {
    // Данные
    config: {
        // Задержка между запусками слотов
        delay_ms: 300,
        // Множитель высоты, 1.0 - высота текста
        height_multiplier: 1.8,
        // Время прокрутки в секундах
        time: 4,
        // Прокруток колеса перед достижением цели
        additional_spins: [3, 3, 2],
        // Частота обновление (кадров в секунду), рекомендуется значение 60 и ниже
        update_rate: 59
    },
    data: {},
    // Функции
    init: function (options) {
        // Инициализация данных
        this.data.slots = [];
        this.data.combination =
            options.slots.combinations[
                Math.floor(Math.random() * options.slots.combinations.length)
            ].targets;
        this.data.combination_status = "success";

        //console.log(this.data.combination);

        for (let index = 0; index < options.selectors.length; index++) {
            this.data.slots[index] = {
                selector: options.selectors[index],
                set: options.slots.sets[index],
                amount: options.slots.sets[index].length,
                progress:
                    (1 / options.slots.sets[index].length) *
                    this.data.combination[index],
                realProgress: 0,
                offsetProgress: 0
            };
            //console.log(this.data.slots[index].progress);
        }
        // Комбинации
        this.data.combinations = options.slots.combinations;

        // Создание DOM-структуры
        this.data.slots.forEach((slot, index) => {
            // Создание передвижного контейнера
            let wrapper = document.createElement("div");
            wrapper.classList.add("slot-wrapper");

            let root = document.querySelector(slot.selector);
            let wrapper_elem = root.appendChild(wrapper);

            this.data.slots[index].wrapper = wrapper_elem;
            this.data.slots[index].heights = options.row_heights[index];

            // Создание наполнения контейнера
            slot.set.forEach((slot_html, index) => {
                // Оригинальный элемент
                let original = document.createElement("div");
                original.innerHTML = slot_html;
                original.classList.add("slot-original");
                original.setAttribute("data-slot-index", index);

                // Копия сверху
                let copy_before = document.createElement("div");
                copy_before.innerHTML = slot_html;
                copy_before.classList.add("slot-copy-before");
                copy_before.setAttribute("data-slot-index", index);

                // Копия снизу
                let copy_after = document.createElement("div");
                copy_after.innerHTML = slot_html;
                copy_after.classList.add("slot-copy-after");
                copy_after.setAttribute("data-slot-index", index);

                wrapper_elem.appendChild(copy_before);
                wrapper_elem.appendChild(original);
                wrapper_elem.appendChild(copy_after);
            });
        });

        this.data.width_index = this.get_width_index();
        this.reposition(true);

        // Слушатели

        window.addEventListener("resize", () => {
            this.reposition(false);
        });

        document
            .querySelector(options.button)
            .addEventListener("click", (e) => {
                let wrapper = null;

                if (e.target.classList.contains(".land-spin-wrapper")) {
                    wrapper = e.target;
                } else {
                    wrapper = e.target.closest(".land-spin-wrapper");
                }

                if (!wrapper.classList.contains("active")) {
                    this.start();

                    wrapper.classList.add("active");

                    setTimeout(() => {
                        wrapper.classList.remove("active");
                    }, 300);
                }
            });
    },
    get_width_index: function () {
        let w = support.getWidth();

        if (w >= 1200) {
            return 0;
        } else if (w >= 960) {
            return 1;
        } else if (w >= 640) {
            return 2;
        } else if (w >= 480) {
            return 3;
        }

        return 4;
    },
    reposition: function (force = false) {
        // Выходим если не нужен рефлоу
        let w_index = this.get_width_index();

        if (!force && w_index === this.data.width_index) {
            return;
        } else {
            this.data.width_index = w_index;
            //console.log("Time for reposition!");
        }

        this.data.slots.forEach((slot, index) => {
            let wrapper = slot.wrapper;

            wrapper.querySelectorAll(".slot-original").forEach((slot_elem) => {
                let index = slot_elem.getAttribute("data-slot-index");
                slot_elem.style.top =
                    -1 *
                    index *
                    this.config.height_multiplier *
                    slot.heights[this.data.width_index] +
                    "px";
            });

            let step_before =
                this.config.height_multiplier *
                slot.heights[this.data.width_index] *
                slot.set.length *
                -1;
            wrapper
                .querySelectorAll(".slot-copy-before")
                .forEach((slot_elem) => {
                    let index = slot_elem.getAttribute("data-slot-index");
                    slot_elem.style.top =
                        step_before +
                        -1 *
                        index *
                        this.config.height_multiplier *
                        slot.heights[this.data.width_index] +
                        "px";
                });

            let step_after =
                this.config.height_multiplier *
                slot.heights[this.data.width_index] *
                slot.set.length;
            wrapper
                .querySelectorAll(".slot-copy-after")
                .forEach((slot_elem) => {
                    let index = slot_elem.getAttribute("data-slot-index");
                    slot_elem.style.top =
                        step_after +
                        -1 *
                        index *
                        this.config.height_multiplier *
                        slot.heights[this.data.width_index] +
                        "px";
                });

            let totalHeight =
                slot.heights[this.data.width_index] *
                slot.set.length *
                this.config.height_multiplier;
            let position = (slot.progress + slot.offsetProgress) % 1;

            let posY = totalHeight * position;

            this.data.slots[index].wrapper.style.transform =
                "translateY(" + posY + "px)";

            slot.wrapper
                .querySelectorAll(
                    'div[data-slot-index="' +
                    this.data.combination[index] +
                    '"]'
                )
                .forEach((elem) => {
                    elem.classList.add("active");
                });
        });
    },
    interpolation(t) {
        if (t < 0.5) {
            t *= t;
            return 8 * t * t;
        } else {
            t = --t * t;
            return 1 - 8 * t * t;
        }
    },
    get_combination: function () {
        this.data.prev_combination_status = this.data.combination_status;
        this.data.prev_combination = this.data.combination;

        let temp_combination = [];

        if (this.data.prev_combination_status === "success") {
            let chance = Math.random();

            if (chance < 0) {
                //console.log("Calculating (after success) -> Random");

                do {
                    temp_combination = [
                        Math.floor(Math.random() * 6),
                        Math.floor(Math.random() * 6)
                    ];

                    let corellation = false;

                    // Checking for success combination
                    this.data.combinations.forEach((combination_array) => {
                        //console.log(
                        // "CMP: " +
                        //     temp_combination +
                        //     " = " +
                        //     combination_array.targets
                        // );
                        if (
                            temp_combination[0] ===
                            combination_array.targets[0] &&
                            temp_combination[1] === combination_array.targets[1]
                        ) {
                            temp_combination.push(combination_array.targets[2]);
                            corellation = true;
                            //console.log("AS: Correlation!");
                        }
                    });
                    // If not success
                    if (!corellation) {
                        temp_combination.push(5);
                        //console.log("AS: Found fail");
                    } else {
                        //console.log("AS: Found success");
                    }
                } while (temp_combination.equals(this.data.prev_combination));
            } else {
                //console.log("Calculating (after success) -> Success");

                do {
                    temp_combination = this.data.combinations[
                        Math.floor(
                            Math.random() * this.data.combinations.length
                        )
                    ].targets;
                } while (temp_combination.equals(this.data.prev_combination));
            }
        } else {
            //console.log("Calculating (after fail) -> Success");
            do {
                temp_combination = this.data.combinations[
                    Math.floor(Math.random() * this.data.combinations.length)
                ].targets;
            } while (temp_combination.equals(this.data.prev_combination));
        }

        //console.log("!!!!!! Combination found: " + temp_combination);
        if (temp_combination[2] === 5) {
            this.data.combination_status = "fail";
        } else {
            this.data.combination_status = "success";
        }

        this.data.combination = temp_combination;

        return [
            (1 / 6) * this.data.combination[0],
            (1 / 6) * this.data.combination[1],
            (1 / 6) * this.data.combination[2]
        ];
    },
    start: function () {
        // Проверка на запуск
        if (this.data.active > 0.1) {
            return;
        } else {
            this.data.active = 1;
        }

        let combi_targets = this.get_combination();

        // Получение целей
        let targets = [
            combi_targets[0] + this.config.additional_spins[0],
            combi_targets[1] + this.config.additional_spins[1],
            combi_targets[2] + this.config.additional_spins[2]
        ];
        // Настройка и раздельный запуск слотов
        this.data.slots.forEach((slot, index) => {
            slot.wrapper.querySelectorAll(".active").forEach((elem) => {
                elem.classList.remove("active");
            });

            // Временные переменные
            this.data.slots[index].offsetProgress =
                (slot.progress + slot.offsetProgress) % 1;
            this.data.slots[index].progess = 0;
            this.data.slots[index].realProgress = 0;

            // Цель
            this.data.slots[index].target =
                targets[index] - slot.offsetProgress;

            // Скорость
            this.data.slots[index].speed =
                1 / this.config.update_rate / this.config.time;

            // Запуск
            setTimeout(() => {
                this.data.slots[index].interval = setInterval(() => {
                    this.step(slot, index);
                }, 1000 / this.config.update_rate);
            }, this.config.delay_ms * index + 1);
        });
    },
    step: function (slot, index) {
        this.data.slots[index].realProgress += slot.speed;
        this.data.slots[index].progress =
            this.interpolation(slot.realProgress) * slot.target;

        if (slot.realProgress >= 0.75) {
            slot.wrapper
                .querySelectorAll(
                    'div[data-slot-index="' +
                    this.data.combination[index] +
                    '"]'
                )
                .forEach((elem) => {
                    elem.classList.add("active");
                });
        }
        if (slot.realProgress >= 1) {
            slot.realProgress = 1;

            clearInterval(this.data.slots[index].interval);
            this.data.slots[index].interval = null;

            this.data.active = this.data.active - 1 / this.data.slots.length;
        }

        let totalHeight =
            slot.heights[this.data.width_index] *
            slot.set.length *
            this.config.height_multiplier;
        let position = (slot.progress + slot.offsetProgress) % 1;

        let posY = totalHeight * position;

        this.data.slots[index].wrapper.style.transform =
            "translateY(" + posY + "px)";
    }
};

landing_scaler.init();
slot_machine.init({
    button: ".land-spin-wrapper",
    selectors: [".slot-set-0", ".slot-set-1", ".slot-set-illustration"],
    // >1200, >960, >640, >480, >0
    row_heights: [
        { 0: 96, 1: 80, 2: 72, 3: 64, 4: 48 },
        { 0: 96, 1: 80, 2: 72, 3: 64, 4: 48 },
        { 0: 720, 1: 620, 2: 460, 3: 460, 4: 300 }
    ],
    slots: {
        sets: [
            [
                "technology",
                "socializing",
                "gaming",
                "today",
                "blockchain",
                "technology"
            ],
            ["future", "fun", "blockchain", "art", "future", "today"],
            // 0 - Tech&Fut, 1-Social&Fun, 2-Game&Blockch, 3-Tech&Art, 4-Today&Fut
            [
                "<img src='https://333616.selcdn.ru/links/SlotMachine/image-0.svg'>",
                "<img src='https://333616.selcdn.ru/links/SlotMachine/image-1.svg'>",
                "<img src='https://333616.selcdn.ru/links/SlotMachine/image-2.svg'>",
                "<img src='https://333616.selcdn.ru/links/SlotMachine/image-3.svg'>",
                "<img src='https://333616.selcdn.ru/links/SlotMachine/image-4.svg'>",
                "<img src='https://333616.selcdn.ru/links/SlotMachine/image-none.svg'>"
            ]
        ],
        combinations: [
            // Technology & Future
            {
                targets: [0, 0, 0]
            },
            // Socializing & Fun
            {
                targets: [1, 1, 1]
            },

            // Gaming & Blockchain
            {
                targets: [2, 2, 2]
            },

            // Technology & Art
            {
                targets: [5, 3, 3]
            },

            // Today & Future
            {
                targets: [3, 4, 4]
            }
        ]
    }
});
