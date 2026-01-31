# Deployment Guide: Manual vs. Ansible

This guide provides a comprehensive walkthrough for deploying applications to cloud environments. We compare the traditional **Manual Deployment** method with the modern, automated approach using **Ansible**.

---

## 🚀 Section 1: Manual Deployment

Manual deployment involves setting up your infrastructure and application environment step-by-step. In this project, we are deploying to three distinct environments on a single server: **Development**, **Staging**, and **Production**.

While manual deployment provides granular control, doing this for all three environments is repetitive, prone to human error, and difficult to scale—which is exactly why we use Ansible later in this guide.


### 1. Prerequisites
Before starting, ensure you have access to cloud resources:
*   **Azure for Students:** Activate your account and access to free credits at [Azure for Students](https://azure.microsoft.com/en-us/free/students?icid=portal).
*   **Terminal Access (Windows Users):** It is highly recommended to download and use [Git Bash](https://git-scm.com/downloads) for a Linux-like terminal experience.

### 2. Infrastructure Setup
1.  **Create a Virtual Machine (VM):** Follow the specific configuration details shared in class to provision your VM on Azure.
2.  **SSH Key Selection:** During the VM creation process, select the **SSH Public Key** option and choose **RSA**.
3.  **Security:** Save your private key locally as `id_rsa`. Keep this file secure and never share it.

### 3. Setting Up Local Permissions (Linux/macOS/Git Bash)
To ensure your SSH key is accepted by the server, you must restrict its permissions. Open your terminal and run:

```bash
chmod 600 <filename>
```
> *Note: Replace `<filename>` with the actual path to your `id_rsa` file.*

### 4. Connecting to the Server
Once the VM is provisioned:
1.  Navigate to the VM resource in the Azure Portal.
2.  Click the **Connect** button and select **SSH**.
3.  Copy the provided command and paste it into your terminal:

```bash
ssh -i <path_to_key> <username>@<vm_ip_address>
```

### 5. Server Preparation
Once connected to the VM, ensure the system is up to date and required tools are installed:

1.  **Update and Upgrade System:**
    ```bash
    sudo apt update && sudo apt upgrade -y
    ```
2.  **Install Git:**
    ```bash
    sudo apt install git
    ```

### 6. Application Deployment (Development Environment)
The following steps detail how to deploy the **Development** version of the application.

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/ubadineke/soe507-ansible
    ```
2.  **Navigate to the Project:**
    ```bash
    cd soe507-ansible
    ```
3.  **Install Node.js and npm:**
    ```bash
    sudo apt install npm
    ```
4.  **Install Project Dependencies:**
    ```bash
    npm install
    ```
5.  **Build the Project:**
    ```bash
    npm run build
    ```
### 7. Serving the Application (Nginx)
After building the project, you need to configure a web server like Nginx to serve your files.

1.  **Install Nginx:**
    ```bash
    sudo apt install nginx
    ```

2.  **Create Deployment Directory:**
    ```bash
    # Standard location for web content
    sudo mkdir -p /var/www/landing-dev
    ```

3.  **Deploy Build Files:**
    ```bash
    sudo cp -r dist/* /var/www/landing-dev/
    ```

4.  **Create Environment Configuration:**
    Run the following to create the `config.js` file (ensure the key names match your `App.jsx`):
    ```bash
    sudo tee /var/www/landing-dev/config.js > /dev/null << 'EOF'
    window.ENV_CONFIG = {
      ENVIRONMENT: "DEVELOPMENT",
      AUTHOR: "<YOUR-NAME-HERE>"
    };
    EOF
    ```

5.  **Set Permissions:**
    Grant ownership to the `www-data` user for all resources in the directory:
    ```bash
    sudo chown -R www-data:www-data /var/www/landing-dev
    ```

### 8. Configuring Nginx Site
1.  **Create the Configuration File:**
    ```bash
    cd /etc/nginx/sites-available/
    sudo touch landing
    ```
2.  **Edit the Configuration:**
    Open the file using Nano:
    ```bash
    sudo nano landing
    ```
    Paste in the following configuration:
    ```nginx
    server {
        listen 80;
        server_name _;
        
        location /dev {
            alias /var/www/landing-dev;
            index index.html;
            try_files $uri $uri/ /dev/index.html;
        }
    }
    ```
    *To save and exit: `Ctrl + S` —-> `Ctrl + X`*

3.  **Enable the Site and Cleanup:**
    ```bash
    # Remove default site
    sudo rm /etc/nginx/sites-enabled/default

    # Enable our new site
    sudo ln -s /etc/nginx/sites-available/landing /etc/nginx/sites-enabled/
    ```

4.  **Test and Reload Nginx:**
    ```bash
    sudo nginx -t
    sudo systemctl reload nginx
    ```

### 9. Verification (Dev)
You can now access your development site by visiting:
**`http://Your-Server-IP/dev`**

---

### 10. Manual Deployment (Staging Environment)
Now we deploy the **Staging** application. Since we have already installed Git, Node, and Nginx, we only need to repeat the environment-specific deployment processes.

1.  **Create Staging Directory:**
    ```bash
    # Standard location for staging web content
    sudo mkdir -p /var/www/landing-staging
    ```

2.  **Deploy Build Files:**
    ```bash
    sudo cp -r dist/* /var/www/landing-staging/
    ```

3.  **Create Staging Configuration:**
    Ensure the `ENVIRONMENT` is set to `"STAGING"`:
    ```bash
    sudo tee /var/www/landing-staging/config.js > /dev/null << 'EOF'
    window.ENV_CONFIG = {
      ENVIRONMENT: "STAGING",
      AUTHOR: "<YOUR-NAME-HERE>"
    };
    EOF
    ```

4.  **Set Permissions:**
    ```bash
    sudo chown -R www-data:www-data /var/www/landing-staging
    ```

5.  **Update Nginx Configuration:**
    We need to add a new location block for `/staging` to our existing configuration.
    ```bash
    sudo nano /etc/nginx/sites-available/landing
    ```
    Append the following inside the `server { ... }` block, below the `/dev` section:
    ```nginx
    location /staging {
        alias /var/www/landing-staging;
        index index.html;
        try_files $uri $uri/ /staging/index.html;
    }
    ```
    *Save and exit: `Ctrl + S` —-> `Ctrl + X`*

6.  **Test and Reload Nginx:**
    ```bash
    sudo nginx -t
    sudo systemctl reload nginx
    ```

### 11. Verification (Staging)
Check your browser at:
**`http://Your-Server-IP/staging`**

### 12. Cleanup (Preparing for Automation)
Before moving to the automated method, it is a good practice to clean up your manually created directories. This ensures that Ansible recreates them from scratch and demonstrates its power to manage the entire file system.

Run the following command to remove all manually deployed directories starting with "landing":
```bash
sudo rm -rf /var/www/landing*
```

## 🤖 Section 2: Automated Deployment with Ansible

The Ansible playbook replicates the exact same workflow as the **Manual Deployment** method—installing dependencies, cloning the repo, building the app, and configuring Nginx—but eliminates the risk of human error. 

By using **Infrastructure as Code (IaC)**, we can reliably deploy to the Development, Staging, and Production environments simultaneously with a single command, ensuring perfect consistency across your entire infrastructure.

### 1. Local Environment Setup
Ansible is natively supported on Linux and macOS. For Windows, there is no official native support for the control node, so we use **Docker** as a workaround to provide a stable Linux environment.

#### **For Windows Users (Running via Docker):**
1.  **Download Git Bash:** Install using default options from [git-scm.com](https://git-scm.com/downloads).
2.  **Install Docker Desktop:** Download and install from [Docker Hub](https://www.docker.com/products/docker-desktop/).
3.  **WSL Update:** If prompted, update your Windows Subsystem for Linux (WSL) as instructed by the Docker installer.
4.  **Activation:** Ensure the Docker Desktop GUI is fully active and the engine is running before attempting docker commands in Git Bash.
5.  **Verify Setup & Download Image:** Run the following command in Git Bash to download the Ansible image and verify everything is working correctly:
    ```bash
    docker run --rm -it \
      -v "${PWD}:/ansible" \
      -v "${HOME}/.ssh:/root/.ssh:ro" \
      quay.io/ansible/ansible-runner:latest \
      ansible --version
    ```
    *This should output the Ansible version details, confirming the image is downloaded and accessible.*

6.  **Configure Ansible Command Alias:** To make running playbooks easier in Git Bash, paste the following function into your terminal. This allows you to run `ansible-playbook` as if it were installed natively:
    ```bash
    ansible-playbook() {
      MSYS_NO_PATHCONV=1 docker run --rm -it \
        -v "$PWD":/ansible \
        -v "$HOME/.ssh/id_rsa":/root/.ssh/id_rsa \
        -w /ansible \
        quay.io/ansible/ansible-runner:latest \
        /bin/bash -lc "chmod 600 /root/.ssh/id_rsa && ansible-playbook $*"
    }
    ```
    *Note: This creates a temporary alias in your current terminal session. Every time you open a new Git Bash window, you will need to paste this function again (or add it to your `.bashrc`).*

#### **For Linux Users (Native Installation):**
Linux users should install Ansible directly using their system's package manager. Refer to the [Official Ansible Installation Guide](https://docs.ansible.com/projects/ansible/latest/installation_guide/installation_distros.html) for specific distribution commands:

---

### 2. SSH Key Management (All Users)
We need to ensure your SSH keys are in the standard location and correctly formatted for Ansible to use.

1.  **Create the .ssh directory:**
    ```bash
    mkdir -p ~/.ssh
    ```

2.  **Move and Secure Private Key:**
    > **Note:** Ensure you have manually copied your downloaded private key (e.g., from your Downloads folder) into the `~/.ssh` directory before running these commands.

    ```bash
    # Rename the key from its initial .pem format to the standard 'id_rsa'
    mv ~/.ssh/id_rsa.pem ~/.ssh/id_rsa

    # Set strict permissions (owner read/write only) - required for SSH security
    chmod 600 ~/.ssh/id_rsa
    ```

3.  **Generate Public Key (Convert to OpenSSH):**
    Ansible/Docker may require the public key counterpart. Generate it using:
    ```bash
    ssh-keygen -y -f ~/.ssh/id_rsa > ~/.ssh/id_rsa.pub
    ```

### 3. Running the Deployment
Once your environment is set up and your keys are ready, follow these steps to deploy:

1.  **Configure Inventory:**
    Open `ansible/inventory.ini` and update the `webservers` section with your VM's public IP and ensure the `ansible_user` matches your VM username.

    **File Template (`inventory.ini`):**
    ```ini
    [webservers]
    <YOUR-VM-IP-ADDRESS> ansible_user=<YOUR-VM-USERNAME>
    ```

2.  **Navigate to the Ansible Directory:**
    ```bash
    cd ansible
    ```

3.  **Execute the Playbook:**

    **For Windows/Git Bash Users:**
    Run the following command (using the alias configured earlier):
    ```bash
    ansible-playbook -i inventory.ini deploy.yml
    ```

    **For Native Linux Users:**
    Linux users can choose to follow the SSH setup in Section 2 above, or they can skip the extra SSH configuration and simply specify the key path directly in the command:
    ```bash
    ansible-playbook -i inventory.ini deploy.yml --private-key=<private-key-file-path>
    ```

### 4. Post-Deployment Verification
Once the playbook completes successfully, confirm that all three environments are running correctly and observe their unique branding (colors) by visiting:

*   **Development:** `http://<YOUR-VM-IP>/dev`
*   **Staging:** `http://<YOUR-VM-IP>/staging`
*   **Production:** `http://<YOUR-VM-IP>/prod`

**What to look for:** Notice that while the application logic is identical, each environment uses different **branding colors** and **environment labels** (defined in your Ansible templates), demonstrating how automation handles complex configurations across multiple tiers.

### 5. Conclusion: Manual vs. Automated
Congratulations! You have now experienced both deployment methods. 

As you've seen, the Ansible playbook replicates the **exact same steps** you performed manually—from system updates and package installations to Nginx configuration. However, by automating the process:
*   **Efficiency:** You deployed to multiple environments (Dev, Staging, and Production) in the time it took to manually configure just one.
*   **Accuracy:** You eliminated the risk of typos, missed steps, or permission errors that often plague manual configurations.
*   **Scalability:** If you needed to deploy to 10 more servers, you would only need to add their IPs to the inventory file and run the same command once.

This is the power of **Infrastructure as Code (IaC)**.

---
