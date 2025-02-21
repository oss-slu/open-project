import { describe, it, expect } from 'vitest';
import request from "supertest";
import { app } from "#index";
import { gt } from "#gt";
import { prisma as mockPrisma } from "#mock-prisma";
//import { prisma } from "#prisma";
//import { tc } from "#setup";

describe("/api/shop/[shopId]/job", () => {
    describe("POST", () => { 

    //Sucessful job creation
    it("Should return 200 OK with job details (ID, title, description, created date)", async () => {
        const res = await request(app)
            .post("/api/shop/[shopId]/job")
            .set(...(await gt()))
            .send({
                jobId: "Job Id",
                title: "Job Title",
                description: "Job Description",
                createdDate: "Job Creation Date",
            });

        expect(res.status).toBe(200);
        expect(res.body).toMatchSnapshot({
            job: [
                {
                    jobId: expect.any(String),
                    title: expect.any(String),
                    description: expect.any(String),
                    createdDate: expect.any(String),
                }

                ]
            })
        })
    })
},
    
    //Missing Required Fields
    it("Should return 400 bad request with relevant error message", async () => {
        const res = await request(app)
            .post("/api/shop/[shopId]/job")
            .set(...(await gt()))
            .send({});
    
        expect(res.status).toBe(400);
        expect(res.status).toBe("Required Field Missing");
        expect(res.body).toMatchSnapshot({
            job: 
                {
                    jobId: expect.any(String),
                    title: expect.any(String),
                    description: expect.any(String),
                    createdDate: expect.any(String),
                }
    });

    // Invalid Data
        it("Should return 400 Bad Request when any field is empty", async () => {
        const res = await request(app)
            .post("/api/shop/[shopId]/job")
            .set(...(await gt()))
            .send({jobId: "", title: "", description: "", createdDate: "" });

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: "Required field cannot be empty" });
        });

        it("Should return 400 Bad Request when any field is not a string", async () => {
        const res = await request(app)
            .post("/api/shop/[shopId]/job")
            .set(...(await gt()))
            .send({ jobId: 1, title: 2, description: 3, createdDate: 4});

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: "All fields must be a string" });
        });

    //Unauthorized User 
    it("Should return 401 Unauthorized with error message", async () => {
        const res = await request(app)
          .post("/api/shop/[shopId]/job")
          .set(...(await gt()))
          .send();
  
        expect(res.status).toBe(401);
        expect(res.body).toEqual({ error: "Unauthorized" });
        expect(mockPrisma.user.findMany).not.toHaveBeenCalled();
});

    //Job Data Consistency
    it("Job ID and data should match request and be valid in system", async () => {
        const res = await request(app)
        .post("/api/shop/[shopId]/job")
        .set(...(await gt()))
        .send();

        expect(res.body).toMatchSnapshot();
    });
}));
