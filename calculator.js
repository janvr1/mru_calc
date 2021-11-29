const O2_MAX = 20.95; // maximum oxygen in %
const p_n = 101.3; // absolute pressure in kPa
const T_n = 273; // temperature in Kelvin
const R = 8.314 // gas constant in m3*Pa/(mol*K)

const input_form = document.getElementById("input_form");
input_form.addEventListener("submit", calculate);

const FUELS = {
    erdgas_E: {
        CO2max: 12.1,
        O2bez: 3,
        A2: 0.64,
        B: 0.009,
        F: 0.8574,

    },
    heizol_EL: {
        CO2max: 15.4,
        O2bez: 3,
        A2: 0.68,
        B: 0.007,
        F: 0.8820,
    },
    propan: {
        CO2max: 13.7,
        O2bez: 3,
        A2: 0.66,
        B: 0.007,
        F: 0.8419,
    },
    butan: {
        CO2max: 14.1,
        O2bez: 3,
        A1: 0.67,
        B: 0.007,
        F: 0.8269,
    },
    holz_trocken: {
        CO2max: 20.3,
        O2bez: 13,
        A1: 0.62,
        B: 0.009,
    },
    pellets: {
        CO2max: 20.3,
        O2bez: 13,
        A1: 0.77,
        B: 0.0
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

function hide_o2ref() {
    if (document.getElementById("unit_CO").value == "mg_m3_o2" || document.getElementById("unit_NO").value == "mg_m3_o2") {
        document.getElementById("row_o2ref").style.visibility = "visible";
        document.getElementById("input_o2ref").setAttribute("required", "required");
        document.getElementById("input_O2").setAttribute("required", "required");
    } else {
        document.getElementById("row_o2ref").style.visibility = "hidden";
        document.getElementById("input_o2ref").removeAttribute("required");
        document.getElementById("input_O2").removeAttribute("required", "required");
    }

    if (document.getElementById("unit_CO").value == "mg_kwh" || document.getElementById("unit_NO").value == "mg_kwh") {
        document.getElementById("input_O2").setAttribute("required", "required");

    } else {
        document.getElementById("input_O2").removeAttribute("required", "required");
    }
}

function fill_o2ref() {
    let fuel = FUELS[document.getElementById("input_fuel").value];
    document.getElementById("calc_o2ref").value = fuel.O2bez;
}

function calculate(e) {
    e.preventDefault();

    // Splošni podatki
    var o2 = document.getElementById("input_O2").value;
    var t_air = document.getElementById("input_Tair").value;
    var t_gas = document.getElementById("input_Tgas").value;
    var calc_o2 = document.getElementById("calc_o2ref").value;
    var inp_o2ref = document.getElementById("input_o2ref").value;
    var fuel = FUELS[document.getElementById("input_fuel").value];

    console.log("Splošni podatki:");
    console.log("O2: " + o2);
    console.log("Calc O2: " + calc_o2);
    console.log("Input O2ref: " + inp_o2ref);
    console.log("Fuel: " + fuel);
    console.log("T_air:" + t_air);
    console.log("T_gas:" + t_gas);
    console.log("----------------------");

    // Splošni izračuni
    if (o2 != "") {
        document.getElementById("output_lambda").innerHTML = Math.round(lambda(o2) * 100) / 100;
        document.getElementById("output_co2").innerHTML = Math.round(co2(fuel, o2) * 10) / 10;
    } else {
        document.getElementById("output_lambda").innerHTML = "--";
        document.getElementById("output_co2").innerHTML = "--";

    }
    if (o2 != "" && t_gas != "" && t_air != "") {
        let loss = Math.round(losses(t_gas, t_air, o2, fuel));
        document.getElementById("output_loss").innerHTML = loss;
        document.getElementById("output_eff").innerHTML = 100 - loss;
    } else {
        document.getElementById("output_loss").innerHTML = "--";
        document.getElementById("output_eff").innerHTML = "--";
    }

    // Izračun CO
    var unit_CO = document.getElementById("unit_CO").value;
    var co = document.getElementById("input_CO").value;

    var co_ppm = 0;

    if (unit_CO == "ppm") {
        co_ppm = co;
    } else if (unit_CO == "mg_m3") {
        co_ppm = co / GASES.CO["mg_m3ppm"];
    } else if (unit_CO == "mg_m3_o2" && inp_o2ref != "" && o2 != "") {
        co_ppm = co / (GASES.CO["mg_m3ppm"] * o2_ref(inp_o2ref, o2));
    } else if (unit_CO == "mg_kwh") {
        co_ppm = co / (GASES.CO["mg_m3ppm"] * lambda(o2) * fuel["F"]);
    } else {
        co_ppm = 0;
    }

    console.log("CO_ppm: " + co_ppm);

    var co_mgm3 = mg_m3(co_ppm, GASES.CO);
    if (co != "") {
        document.getElementById("output_CO_ppm").innerHTML = Math.round(co_ppm * 10) / 10;
        document.getElementById("output_CO_m3").innerHTML = Math.round(co_mgm3 * 10) / 10;

    } else {
        document.getElementById("output_CO_ppm").innerHTML = "--";
        document.getElementById("output_CO_m3").innerHTML = "--";

    }

    if (o2 != "" && calc_o2 != "" && co != "") {
        document.getElementById("output_CO_m3o2").innerHTML = Math.round(co_mgm3 * o2_ref(calc_o2, o2) * 10) / 10; // 
        document.getElementById("output_CO_m3o2_unit").innerHTML = "mg/m<sup>3</sup> | O<sub>2</sub>=" + calc_o2 + "%";
    } else {
        document.getElementById("output_CO_m3o2").innerHTML = "--"
    }
    if (o2 != "" && fuel.F != null && co != "") {
        document.getElementById("output_CO_kwh").innerHTML = Math.round(mg_kwh(co_mgm3, o2, fuel.F) * 10) / 10;
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
    } else if (unit_NO == "mg_m3_o2" && inp_o2ref != "" && o2 != "") {
        no_ppm = no / (GASES.NO["mg_m3ppm"] * o2_ref(inp_o2ref, o2));
    } else if (unit_NO == "mg_kwh") {
        no_ppm = no / (GASES.NO["mg_m3ppm"] * lambda(o2) * fuel["F"]);
    } else {
        no_ppm = 0;
    }

    console.log("NO_ppm: " + no_ppm);

    var no_mgm3 = mg_m3(no_ppm, GASES.NO);

    if (no != "") {
        document.getElementById("output_NO_ppm").innerHTML = Math.round(no_ppm * 10) / 10;
        document.getElementById("output_NO_m3").innerHTML = Math.round(no_mgm3 * 10) / 10;
    } else {
        document.getElementById("output_NO_ppm").innerHTML = "--";
        document.getElementById("output_NO_m3").innerHTML = "--";
    }

    if (o2 != "" && calc_o2 != "" && no != "") {
        document.getElementById("output_NO_m3o2").innerHTML = Math.round(no_mgm3 * o2_ref(calc_o2, o2) * 10) / 10; // 
        document.getElementById("output_NO_m3o2_unit").innerHTML = "mg/m<sup>3</sup> | O<sub>2</sub>=" + calc_o2 + "%";
    } else {
        document.getElementById("output_NO_m3o2").innerHTML = "--"
    }

    if (o2 != "" && fuel.F != null && no != "") {
        document.getElementById("output_NO_kwh").innerHTML = Math.round(mg_kwh(no_mgm3, o2, fuel.F) * 10) / 10;

    } else {
        document.getElementById("output_NO_kwh").innerHTML = "--";

    }
    // Izračun NOx
    let nox_add = document.getElementById("input_NOx").value;
    nox_factor = 1 + nox_add / 100;
    var nox_ppm = no_ppm * nox_factor;

    console.log("NOx_ppm: " + nox_ppm);

    var nox_mgm3 = mg_m3(nox_ppm, GASES.NO2);
    if (no != "" && nox_add != "") {
        document.getElementById("output_NOx_ppm").innerHTML = Math.round(nox_ppm * 10) / 10;
        document.getElementById("output_NOx_m3").innerHTML = Math.round(nox_mgm3 * 10) / 10;

    } else {
        document.getElementById("output_NOx_ppm").innerHTML = "--";
        document.getElementById("output_NOx_m3").innerHTML = "--";
    }

    if (o2 != "" && calc_o2 != "" && no != "" && nox_add != "") {
        document.getElementById("output_NOx_m3o2").innerHTML = Math.round(nox_mgm3 * o2_ref(calc_o2, o2) * 10) / 10; // 
        document.getElementById("output_NOx_m3o2_unit").innerHTML = "mg/m<sup>3</sup> | O<sub>2</sub>=" + calc_o2 + "%";
    } else {
        document.getElementById("output_NOx_m3o2").innerHTML = "--";
    }
    if (o2 != "" && fuel.F != null && no != "" && nox_add != "") {
        document.getElementById("output_NOx_kwh").innerHTML = Math.round(mg_kwh(nox_mgm3, o2, fuel.F) * 10) / 10;
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

function co2(fuel, o2) {
    let co2 = fuel.CO2max * (1 - o2 / O2_MAX);
    return co2;
}

function losses(t_gas, t_air, o2, fuel) {
    let loss = (t_gas - t_air) * (fuel.B + fuel.A2 / (O2_MAX - o2));
    return loss;
}
