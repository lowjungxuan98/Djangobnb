import {getUserId} from "../lib/actions";
import PropertyList from "../components/properties/PropertyList";
import React, {Suspense} from "react";

const MyPropertiesPage = async () => {
    const userId = await getUserId();

    return (
        <main className="max-w-[1500px] mx-auto px-6 pb-6">
            <h1 className="my-6 text-2xl">My properties</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Suspense fallback={<div>Loading properties...</div>}>
                    <PropertyList
                        landlord_id={userId}
                    />
                </Suspense>
            </div>
        </main>
    )
}

export default MyPropertiesPage;