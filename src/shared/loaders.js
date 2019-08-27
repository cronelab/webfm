const fetchAndStoreBrain = async subject => {
    let storedBrain = JSON.parse(localStorage.getItem(`brain`));
    if (storedBrain != null && storedBrain.subject == subject) {
        return storedBrain.brain
    } else {
        console.log("Fetching brain ...")
        localStorage.removeItem('brain')
        let response = await fetch(`/api/brain/${subject}`);
        let brain = await response.text();
        let storedBrain = {
            'subject': subject,
            'brain': brain
        }
        localStorage.setItem(`brain`, JSON.stringify(storedBrain));
        return brain
    }
}

const fetchAndStoreGeometry = async subject => {
    let storedGeometry = JSON.parse(localStorage.getItem(`geometry`));
    if (storedGeometry != null && storedGeometry.subject == subject) {
        return storedGeometry.geometry
    } else {
        console.log("Fetching geometry ...")
        localStorage.removeItem('geometry')
        let response = await fetch(`/api/geometry/${subject}`);
        let geometry = await response.json();
        let storedGeometry = {
            'subject': subject,
            'brain': geometry
        }
        localStorage.setItem(`geometry`, JSON.stringify(storedGeometry));
        return geometry
    }
}

export {
    fetchAndStoreBrain,
    fetchAndStoreGeometry
};