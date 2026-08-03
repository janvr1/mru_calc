const O2_MAX = 20.95; // maksimalna vsebnost kisika v %
const V_MOL = 22.414;  // molski volumen idealnega plina pri n. pogojih (l/mol)

// Molske mase plinov (g/mol) in oznake za prikaz.
// NOx se po dogovoru izraža kot NO2 (uporabi molsko maso NO2).
const GASES = {
    CO: { M: 28.010, label: "CO" },
    NO: { M: 30.006, label: "NO" },
    NO2: { M: 46.006, label: "NO<sub>2</sub>" },
    NOx: { M: 46.006, label: "NO<sub>x</sub>" },
    SO2: { M: 64.066, label: "SO<sub>2</sub>" },
    N2O: { M: 44.013, label: "N<sub>2</sub>O" },
    H2S: { M: 34.081, label: "H<sub>2</sub>S" }
};

// Plini, ki jih uporabnik vnaša (NOx se izračuna iz NO + NO2)
const INPUT_GASES = ["CO", "NO", "NO2", "SO2", "N2O", "H2S"];
// Plini, ki se prikažejo v rezultatih
const RESULT_GASES = ["CO", "NO", "NO2", "NOx", "SO2", "N2O", "H2S"];

// Pretvorbeni faktor mg/m3 na ppm za posamezni plin
function mg_m3ppm(gas) {
    return GASES[gas].M / V_MOL;
}

// Faktor za preračun na referenčno vsebnost kisika
function o2_factor(o2_ref, o2_meas) {
    return (O2_MAX - o2_ref) / (O2_MAX - o2_meas);
}

const form = document.getElementById("input_form");

// Sprotni preračun ob vsaki spremembi vnosa.
// Poslušamo na dokumentu, ker so nekatera vnosna polja (SO2, N2O, H2S,
// O2, O2ref) izven elementa <form> in njihovi dogodki ne dosežejo forme.
form.addEventListener("submit", function (e) { e.preventDefault(); calculate(); });
document.addEventListener("input", calculate);
document.addEventListener("change", calculate);

function fmt(x) {
    if (!isFinite(x)) return "--";
    var abs = Math.abs(x);
    var dec = abs >= 100 ? 1 : (abs >= 1 ? 2 : 4);
    return (Math.round(x * Math.pow(10, dec)) / Math.pow(10, dec)).toString();
}

// Vhodno vrednost posameznega plina pretvori na dejansko koncentracijo v ppm
function input_ppm(gas, haveO2, k) {
    var val = document.getElementById("input_value_" + gas).value;
    if (val === "" || isNaN(parseFloat(val))) return NaN;
    val = parseFloat(val);

    var unit = document.getElementById("input_unit_" + gas).value;
    var f = mg_m3ppm(gas);

    if (unit == "ppm") return val;
    if (unit == "mg_m3") return val / f;
    if (unit == "ppm_o2") return haveO2 ? val / k : NaN;
    if (unit == "mg_m3_o2") return haveO2 ? (val / k) / f : NaN;
    return NaN;
}

function calculate() {
    var o2_meas = document.getElementById("input_o2").value;
    var o2_ref = document.getElementById("input_o2ref").value;

    var haveO2 = o2_meas !== "" && o2_ref !== "" &&
        !isNaN(parseFloat(o2_meas)) && !isNaN(parseFloat(o2_ref)) &&
        parseFloat(o2_meas) < O2_MAX;
    var k = haveO2 ? o2_factor(parseFloat(o2_ref), parseFloat(o2_meas)) : NaN;

    // Dejanska koncentracija v ppm za vsak vhodni plin
    var ppm = {};
    INPUT_GASES.forEach(function (g) {
        ppm[g] = input_ppm(g, haveO2, k);
    });

    // NOx = NO + NO2 (v ppm), izražen kot NO2
    var no = isNaN(ppm["NO"]) ? 0 : ppm["NO"];
    var no2 = isNaN(ppm["NO2"]) ? 0 : ppm["NO2"];
    if (isNaN(ppm["NO"]) && isNaN(ppm["NO2"])) {
        ppm["NOx"] = NaN;
    } else {
        ppm["NOx"] = no + no2;
    }

    // Osveži oznake enot z referenčnim kisikom in izpiši rezultate
    var refText = o2_ref !== "" ? o2_ref : "X";
    RESULT_GASES.forEach(function (g) {
        document.getElementById("out_" + g + "_mgm3o2_unit").innerHTML =
            "mg/m<sup>3</sup> | O<sub>2</sub>=" + refText + "%";
        document.getElementById("out_" + g + "_ppmo2_unit").innerHTML =
            "ppm | O<sub>2</sub>=" + refText + "%";

        var p = ppm[g];
        var f = mg_m3ppm(g);
        var mgm3 = p * f;
        var mgm3_o2 = haveO2 ? mgm3 * k : NaN;
        var ppm_o2 = haveO2 ? p * k : NaN;

        document.getElementById("out_" + g + "_ppm").innerHTML = fmt(p);
        document.getElementById("out_" + g + "_mgm3").innerHTML = fmt(mgm3);
        document.getElementById("out_" + g + "_mgm3o2").innerHTML = fmt(mgm3_o2);
        document.getElementById("out_" + g + "_ppmo2").innerHTML = fmt(ppm_o2);
    });
}

// Prvi izračun ob nalaganju
calculate();
