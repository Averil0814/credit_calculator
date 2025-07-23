document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('calculateBtn').addEventListener('click', calculateCredits);
});

function calculateCredits() {
    const input = document.getElementById('dataInput').value.trim();
    const lines = input.split('\n');
    let passedCredits = 0;

    // Graduation requirements
    const requiredCourses = [
        // 系統工程領域
        "系統建模與模擬", "風險分析", "複雜系統專案管理", "系統工程導論",
        // 太空工程領域
        "太空任務與系統設計", "任務和系統設計認證確認", "太空系統整合", "高效益太空任務營運"
    ];
    const thesisCourses = ["學位論文研究"];
    const ethicsCourse = "學術研究倫理教育課程";
    const genderCourse = "性別平等教育線上訓練課程";
    const seminarCourse = "書報討論";
    let requiredCoursesTaken = [];
    let systemFieldCount = 0;
    let spaceFieldCount = 0;
    let thesisCount = 0;
    let thesisCredits = 0;
    let seminarCount = 0;
    let ethicsPassed = false;
    let genderPassed = false;

    let parsedCourses = [];

    // Find the start of the course records
    let startIdx = lines.findIndex(line => line.includes('學期') && line.includes('課號'));
    if (startIdx === -1) {
        document.getElementById('result').innerHTML = "<p>找不到課程紀錄，請檢查貼上的資料是否正確。</p>";
        return;
    }

    for (let i = startIdx + 1; i < lines.length; i++) {
        const line = lines[i].trim();
        // Skip empty lines, summary lines, or lines that don't start with a number (list index)
        if (!line || !/^\d/.test(line) || line.startsWith('實得學分')) continue;

        // Regex to handle the new format with more columns and potential empty grades
        const match = line.match(/^\d+\s+(\d{4})\s+(\S+)\s+\S+\s+(.+?)\s+(必修|選修)\s+([\d.]+)\s+([A-Z]?[+-]?|通過|\s*)\s+/);
        if (!match) continue;

        const semester = match[1];
        const courseNumber = match[2];
        const courseName = match[3].trim();
        const type = match[4]; // Corrected order
        const credits = parseFloat(match[5]); // Corrected order
        const grade = match[6].trim();

        // Skip withdrawn courses ('W') or courses with no grade
        if (grade === '' || line.includes('W')) {
            parsedCourses.push({ semester, courseNumber, courseName, credits, type, grade: 'W', passed: false });
            continue;
        }

        const passed = (
            grade.startsWith('A') ||
            grade.startsWith('B') ||
            grade.startsWith('C') ||
            grade === '通過'
        );

        parsedCourses.push({ semester, courseNumber, courseName, credits, type, grade, passed });

        // Only count passed credits for courses with credits > 0
        if (passed && !isNaN(credits) && credits > 0) {
            passedCredits += credits;
        }

        // Check required courses (must be passed)
        if (passed && requiredCourses.includes(courseName) && !requiredCoursesTaken.includes(courseName)) {
            requiredCoursesTaken.push(courseName);
            // 系統工程領域
            if (["系統建模與模擬", "風險分析", "複雜系統專案管理", "系統工程導論"].includes(courseName)) {
                systemFieldCount++;
            }
            // 太空工程領域
            if (["太空任務與系統設計", "任務和系統設計認證確認", "太空系統整合", "高效益太空任務營運"].includes(courseName)) {
                spaceFieldCount++;
            }
        }

        // Check thesis courses
        if (passed && thesisCourses.includes(courseName)) {
            thesisCount++;
            thesisCredits += credits;
        }

        // Check seminar courses
        if (passed && courseName.startsWith(seminarCourse)) {
            seminarCount++;
        }

        // Check ethics/gender courses
        if (passed && courseName === ethicsCourse) {
            ethicsPassed = true;
        }
        if (passed && courseName === genderCourse) {
            genderPassed = true;
        }
    }

    // Graduation checks
    let gradChecks = [];
    const passedCreditsMet = passedCredits >= 30;
    gradChecks.push(`通過學分: <strong class="${passedCreditsMet ? '' : 'fail'}">${passedCredits}</strong>（需≥30）`);
    gradChecks.push(`必選修專業課程: ${requiredCoursesTaken.length} 門（需4門，系統工程領域至少1門，太空工程領域至少1門，共12學分）`);
    gradChecks.push(`系統工程領域: ${systemFieldCount} 門（需≥1）`);
    gradChecks.push(`太空工程領域: ${spaceFieldCount} 門（需≥1）`);
    gradChecks.push(`學位論文研究: ${thesisCount} 門，共${thesisCredits} 學分（需2門，6學分）`);
    gradChecks.push(`書報討論課程: ${seminarCount} 門（最多4門，每學期1門）`);

    // Final graduation determination
    const meetsStandard =
        passedCreditsMet &&
        requiredCoursesTaken.length >= 4 &&
        systemFieldCount >= 1 &&
        spaceFieldCount >= 1 &&
        thesisCount >= 2 &&
        thesisCredits >= 6;

    // Generate course table
    let tableHTML = '<h3>課程列表</h3><table class="course-table"><thead><tr><th>學期</th><th>課號</th><th>課名</th><th>學分</th><th>選別</th><th>等級成績</th></tr></thead><tbody>';
    parsedCourses.forEach(course => {
        tableHTML += `<tr>
            <td>${course.semester}</td>
            <td>${course.courseNumber}</td>
            <td>${course.courseName}</td>
            <td>${course.credits.toFixed(2)}</td>
            <td>${course.type}</td>
            <td>${course.grade}</td>
        </tr>`;
    });
    tableHTML += '</tbody></table>';

    const finalStatusString = meetsStandard 
        ? `<strong>符合</strong>` 
        : `<strong class="fail">不符合</strong>`;

    document.getElementById('result').innerHTML =
        '<h3>畢業資格審查</h3>' +
        gradChecks.map(c => `<p>${c}</p>`).join('') +
        `<p>畢業資格判定: ${finalStatusString}</p>` +
        tableHTML;
}