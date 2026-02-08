# Push MindCare to GitHub

Follow these steps in order.

---

## Option A: Single Repo (Neurofro + neuroback together)

If you want **one repository** containing both frontend and backend:

### 1. Open Terminal in project folder
```bash
cd "/Users/harshitapradhan/Desktop/mini 6"
```

### 2. Initialize git (if not already)
```bash
git init
```

### 3. Add all files
```bash
git add .
```

### 4. Commit
```bash
git commit -m "Initial commit: MindCare cognitive wellness platform"
```

### 5. Create repo on GitHub
- Go to https://github.com/new
- Create a new repository (e.g., `mindcare`)
- **Do not** initialize with README (you already have files)

### 6. Add remote and push
```bash
git remote add origin https://github.com/YOUR_USERNAME/mindcare.git
git branch -M main
git push -u origin main
```
*(Replace YOUR_USERNAME with your GitHub username)*

---

## Option B: Submodules (Neurofro and neuroback as separate repos)

If Neurofro and neuroback are **already git submodules**, run inside each:

### Neurofro
```bash
cd Neurofro
git add .
git commit -m "Frontend updates"
git push
cd ..
```

### neuroback
```bash
cd neuroback
git add .
git commit -m "Backend updates"
git push
cd ..
```

### Main project
```bash
git add Neurofro neuroback
git commit -m "Update submodules"
git push
```

---

## Notes

- **Models** (`.pkl`, `.onnx`) are included—they're needed for the app
- **Uploads** and **runtime data** are ignored (see `.gitignore`)
- If push fails due to size, you may need to use [Git LFS](https://git-lfs.github.com/) for large model files
