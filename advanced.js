const O2_MAX = 20.95; // maksimalna vsebnost kisika v %
const V_MOL = 22.414;  // molski volumen idealnega plina pri n. pogojih (l/mol)

// Molske mase plinov (g/mol). NOx se po dogovoru izraža kot NO2.
const GASES = {
    CO: { M: 28.010, label: "CO" },
    NO: { M: 30.006, label: "NO" },
    NO2: { M: 46.006, label: "NO<sub>2</sub>" },
    NOx: { M: 46.006, label: "NO<sub>x</sub>" }, // izraženo kot NO2
    SO2: { M: 64.066, label: "SO<sub>2</sub>" },
    N2O: { M: 44.013, label: "N<sub>2</sub>O" },
    H2S: { M: 34.081, label: "H<sub>2</sub>S" }
};

// Pretvorbeni faktor mg/m3 na ppm za posamezni plin
function mg_m3ppm(gas) {
    return GASES[gas].M / V_MOL;
}

// Faktor za preračun na referenčno vsebnost kisika
function o2_factor(o2_ref, o2_meas) {
    return (O2_MAX - o2_ref) / (O2_MAX - o2_meas);
}

const form = document.getElementById("input_form");

// Sprotni preračun ob vsaki spremembi vnosa
form.addEventListener("submit", function (e) { e.preventDefault(); calculate(); });
form.addEventListener("input", calculate);
form.addEventListener("change", calculate);

function fmt(x) {
    if (!isFinite(x)) return "--";
    // Prilagodljivo število decimalk glede na velikost vrednosti
    var abs = Math.abs(x);
    var dec = abs >= 100 ? 1 : (abs >= 1 ? 2 : 4);
    return (Math.round(x * Math.pow(10, dec)) / Math.pow(10, dec)).toString();
}

function calculate() {
    var gas = document.getElementById("input_gas").value;
    var unit = document.getElementById("input_unit").value;
    var val = document.getElementById("input_value").value;
    var o2_meas = document.getElementById("input_o2").value;
    var o2_ref = document.getElementById("input_o2ref").value;

    // Osveži enote/oznake, ki so odvisne od plina in ref. kisika
    document.getElementById("out_gas_label").innerHTML = GASES[gas].label;
    var refText = o2_ref !== "" ? o2_ref : "X";
    document.getElementById("out_o2ref_mg").innerHTML =
        "mg/m<sup>3</sup> | O<sub>2</sub>=" + refText + "%";
    document.getElementById("out_o2ref_ppm").innerHTML =
        "ppm | O<sub>2</sub>=" + refText + "%";

    var f = mg_m3ppm(gas); // faktor mg/m3 na ppm

    // Ali imamo veljavna podatka o kisiku za referenčni preračun
    var haveO2 = o2_meas !== "" && o2_ref !== "" &&
        !isNaN(parseFloat(o2_meas)) && !isNaN(parseFloat(o2_ref)) &&
        parseFloat(o2_meas) < O2_MAX;
    var k = haveO2 ? o2_factor(parseFloat(o2_ref), parseFloat(o2_meas)) : NaN;

    if (val === "" || isNaN(parseFloat(val))) {
        setOutputs(NaN, NaN, NaN, NaN);
        return;
    }
    val = parseFloat(val);

    // Vse pretvorimo na dejansko koncentracijo v ppm (pri izmerjenem O2)
    var ppm;
    if (unit == "ppm") {
        ppm = val;
    } else if (unit == "mg_m3") {
        ppm = val / f;
    } else if (unit == "ppm_o2") {
        ppm = haveO2 ? val / k : NaN;
    } else if (unit == "mg_m3_o2") {
        ppm = haveO2 ? (val / k) / f : NaN;
    } else {
        ppm = NaN;
    }

    var mgm3 = ppm * f;
    var mgm3_o2 = haveO2 ? mgm3 * k : NaN;
    var ppm_o2 = haveO2 ? ppm * k : NaN;

    setOutputs(ppm, mgm3, mgm3_o2, ppm_o2);
}

function setOutputs(ppm, mgm3, mgm3_o2, ppm_o2) {
    document.getElementById("out_ppm").innerHTML = fmt(ppm);
    document.getElementById("out_mgm3").innerHTML = fmt(mgm3);
    document.getElementById("out_mgm3_o2").innerHTML = fmt(mgm3_o2);
    document.getElementById("out_ppm_o2").innerHTML = fmt(ppm_o2);
}

// Prvi izračun ob nalaganju
calculate();
