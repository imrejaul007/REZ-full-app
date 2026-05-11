// MongoDB Replica Set Initialization Script
// This script initializes the loyalty-rs replica set

rs.initiate({
  _id: "loyalty-rs",
  members: [
    { _id: 0, host: "mongodb-primary:27017", priority: 3 },
    { _id: 1, host: "mongodb-secondary-1:27017", priority: 2 },
    { _id: 2, host: "mongodb-secondary-2:27017", priority: 1 }
  ]
}, { force: true });

// Wait for replica set to be ready
print("Waiting for replica set to initialize...");
sleep(3000);

// Verify replica set status
var status = rs.status();
print("Replica set status:");
printjson(status);

// Configure write concern for production
print("Configuring replica set settings...");
rs.conf().settings = {
  "electionTimeoutMillis": 10000,
  "heartbeatTimeoutSecs": 10
};
rs.reconfig(rs.conf(), { force: true });

print("Replica set initialization complete!");
