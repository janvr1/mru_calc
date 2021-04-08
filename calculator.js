const O2_MAX = 20.9; // maximum oxygen in %
const p_n = 101.3; // absolute pressure in kPa
const T_n = 273; // temperature in Kelvin
const R = 8.314 // gas constant in m3*Pa/(mol*K)

const input_form = document.getElementById("input_form");
input_form.addEventListener("submit", calculate);

const FUELS = {
    erdgas_LL: {
        V: 7.700,
        H: 8.820,
        F: 0.8730,
    },
    heizol_EL: {
        V: 10.375,
        H: 11.86,
        F: 0.8748,
    }
}

const GASES = {
    CO: {
        M: 28.01,
        mg_m3ppm: 1.249
    },
    NO: {
        M: 30.006,
        mg_m3ppm: 1.339
    },
    NO2: {
        M: 46.006,
        mg_m3ppm: 2.053
    }
}

function hide_o2() {
    if (document.getElementById("unit_CO").value == "mg_m3_o2" || document.getElementById("unit_NO").value == "mg_m3_o2") {
        document.getElementById("row_o2ref").style.visibility = "visible";
    } else {
        document.getElementById("row_o2ref").style.visibility = "hidden";
    }
}

function calculate(e) {
    e.preventDefault();

    // Splošni podatki
    var o2 = document.getElementById("input_O2").value;
    var calc_o2 = document.getElementById("calc_o2ref").value;
    var inp_o2ref = document.getElementById("input_o2ref").value;
    var fuel = document.getElementById("input_fuel").value;

    console.log("Splošni podatki:");
    console.log("O2: " + o2);
    console.log("Calc O2: " + calc_o2);
    console.log("Input O2ref: " + inp_o2ref);
    console.log("Fuel: " + fuel);
    console.log("----------------------");

    // Izračun CO
    var unit_CO = document.getElementById("unit_CO").value;
    var co = document.getElementById("input_CO").value;

    var co_ppm = 0;

    if (unit_CO == "ppm") {
        co_ppm = co;
    } else if (unit_CO == "mg_m3") {
        co_ppm = co / GASES.CO["mg_m3ppm"];
    } else if (unit_CO == "mg_m3_o2" && inp_o2ref != "") {
        co_ppm = co / (GASES.CO["mg_m3ppm"] * o2_ref(inp_o2ref, o2));
    } else if (unit_CO == "mg_kwh") {
        co_ppm = co / (GASES.CO["mg_m3ppm"] * lambda(o2) * FUELS[fuel]["F"]);
    } else {
        co_ppm = 0;
    }

    console.log("CO_ppm: " + co_ppm);

    document.getElementById("output_CO_ppm").innerHTML = Math.round(co_ppm * 10) / 10;
    var co_mgm3 = mg_m3(co_ppm, GASES.CO);
    document.getElementById("output_CO_m3").innerHTML = Math.round(co_mgm3 * 10) / 10;

    if (o2 != "" && calc_o2 != "") {
        document.getElementById("output_CO_m3o2").innerHTML = Math.round(co_mgm3 * o2_ref(calc_o2, o2) * 10) / 10; // 
        document.getElementById("output_CO_m3o2_unit").innerHTML = "mg/m<sup>3</sup> | O<sub>2ref</sub>=" + calc_o2 + "%";
    } else {
        document.getElementById("output_CO_m3o2").innerHTML = "--"
    }
    if (o2 != "") {
        document.getElementById("output_CO_kwh").innerHTML = Math.round(mg_kwh(co_mgm3, o2, FUELS[fuel].F) * 10) / 10;
    } else {
        document.getElementById("output_CO_kwh").innerHTML = "--"
    }


    // Izračun NO
    var unit_NO = document.getElementById("unit_NO").value;
    var no = document.getElementById("input_NO").value;

    var no_ppm = 0;

    if (unit_NO == "ppm") {
        no_ppm = no;
    } else if (unit_NO == "mg_m3") {
        no_ppm = no / GASES.NO["mg_m3ppm"];
    } else if (unit_NO == "mg_m3_o2" && inp_o2ref != "") {
        no_ppm = no / (GASES.NO["mg_m3ppm"] * o2_ref(inp_o2ref, o2));
    } else if (unit_NO == "mg_kwh") {
        no_ppm = no / (GASES.NO["mg_m3ppm"] * lambda(o2) * FUELS[fuel]["F"]);
    } else {
        no_ppm = 0;
    }

    console.log("NO_ppm: " + no_ppm);

    document.getElementById("output_NO_ppm").innerHTML = Math.round(no_ppm * 10) / 10;
    var no_mgm3 = mg_m3(no_ppm, GASES.NO);
    document.getElementById("output_NO_m3").innerHTML = Math.round(no_mgm3 * 10) / 10;
    if (o2 != "" && calc_o2 != "") {
        document.getElementById("output_NO_m3o2").innerHTML = Math.round(no_mgm3 * o2_ref(calc_o2, o2) * 10) / 10; // 
        document.getElementById("output_NO_m3o2_unit").innerHTML = "mg/m<sup>3</sup> | O<sub>2ref</sub>=" + calc_o2 + "%";
    } else {
        document.getElementById("output_NO_m3o2").innerHTML = "--"
    }

    if (o2 != "") {
        document.getElementById("output_NO_kwh").innerHTML = Math.round(mg_kwh(no_mgm3, o2, FUELS[fuel].F) * 10) / 10;

    } else {
        document.getElementById("output_NO_kwh").innerHTML = "--";

    }
    // Izračun NOx
    nox_factor = 1 + document.getElementById("input_NOx").value / 100;
    var nox_ppm = no_ppm * nox_factor;

    console.log("NOx_ppm: " + nox_ppm);

    document.getElementById("output_NOx_ppm").innerHTML = Math.round(nox_ppm * 10) / 10;
    var nox_mgm3 = mg_m3(no_ppm, GASES.NO2);
    document.getElementById("output_NOx_m3").innerHTML = Math.round(nox_mgm3 * 10) / 10;
    if (o2 != "" && calc_o2 != "") {
        document.getElementById("output_NOx_m3o2").innerHTML = Math.round(nox_mgm3 * o2_ref(calc_o2, o2) * 10) / 10; // 
        document.getElementById("output_NOx_m3o2_unit").innerHTML = "mg/m<sup>3</sup> | O<sub>2ref</sub>=" + calc_o2 + "%";
    } else {
        document.getElementById("output_NOx_m3o2").innerHTML = "--";
    }
    if (o2 != "") {
        document.getElementById("output_NOx_kwh").innerHTML = Math.round(mg_kwh(no_mgm3, o2, FUELS[fuel].F) * 10) / 10;
    } else {
        document.getElementById("output_NOx_kwh").innerHTML = "--";
    }

}

function o2_ref(o2_ref, o2) {
    var ret = (O2_MAX - o2_ref) / (O2_MAX - o2);
    return ret;
}

function lambda(o2) {
    var ret = O2_MAX / (O2_MAX - o2);
    return ret;
}

function mg_m3(ppm, gas) {
    return ppm * gas["mg_m3ppm"];
}

function mg_kwh(mg_m3, o2, F) {
    var ret = mg_m3 * lambda(o2) * F;
    return ret;
}

document.getElementById("navbar_burger").addEventListener("click", function () {
    this.classList.toggle("is-active")
    document.getElementById("navbar_menu").classList.toggle("is-active")
})